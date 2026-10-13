import type { FunnelInputEvent } from './funnel-intelligence';

/**
 * R20.7 — Case Intelligence (Phase 14).
 *
 * Pure computation over the R20.1 event stream: answers "which case draws
 * the most interest / leads / scroll / meetings?" without DOM, storage or
 * network, so it can later run against a warehouse export.
 *
 * Attribution order (first match wins, never identity-based):
 *   1. `data.case`      — stamp emitted by the case template itself
 *   2. `data.source`    — `case:<slug>` / `case_final:<slug>` (assessments)
 *   3. `data.journey`   — last case detail path of the recorded journey
 *   4. `path`           — page_view / scroll on the case route
 *
 * Event-proxy semantics are inherited from R20.2: counts are event counts,
 * never person counts.
 */

export const CASE_DETAIL_PATH = /^\/portfolio\/([^/?#]+)\/?$/;

/** Scroll location prefix emitted by the case detail template. */
export const CASE_LOCATION_PREFIX = 'case_';

export interface CaseStats {
  slug: string;
  /** page_view events on /portfolio/<slug>. */
  views: number;
  /** cta_click events attributed to this case (booking, contact, pillar…). */
  ctaClicks: number;
  /** assessment_start events attributed to this case. */
  assessments: number;
  /** generate_lead events attributed to this case. */
  leads: number;
  /** schedule_appointment events attributed to this case. */
  meetings: number;
  /** Deepest scroll depth reached (0 when never scrolled). */
  maxScroll: number;
  /** ctaClicks / views — null below 100 views (sample too small). */
  ctr: number | null;
}

/** `/portfolio/<slug>` → `<slug>`; anything else → null. */
export const caseSlugFromPath = (path: string | undefined | null): string | null => {
  if (!path) return null;
  const match = path.match(CASE_DETAIL_PATH);
  return match ? match[1] : null;
};

/** Last case detail path inside a recorded journey (R20.1 `data.journey`). */
export const caseFromJourney = (journey: unknown): string | null => {
  if (!Array.isArray(journey)) return null;
  let last: string | null = null;
  for (const step of journey) {
    if (typeof step !== 'string') continue;
    const slug = caseSlugFromPath(step);
    if (slug) last = slug;
  }
  return last;
};

/** The case an event belongs to, following the documented attribution order. */
export const caseForEvent = (event: FunnelInputEvent): string | null => {
  const stamp = event.data?.['case'];
  if (typeof stamp === 'string' && stamp.length > 0) return stamp;

  const source = event.data?.['source'];
  if (typeof source === 'string') {
    const match = source.match(/case(?:_final)?:([a-z0-9-]+)/);
    if (match) return match[1];
  }

  const fromJourney = caseFromJourney(event.data?.['journey']);
  if (fromJourney) return fromJourney;

  return caseSlugFromPath(event.path);
};

const emptyStats = (slug: string): CaseStats => ({
  slug,
  views: 0,
  ctaClicks: 0,
  assessments: 0,
  leads: 0,
  meetings: 0,
  maxScroll: 0,
  ctr: null,
});

/** Per-case stats from the raw event stream (slug-sorted, deterministic). */
export const getCaseStats = (
  events: FunnelInputEvent[],
  knownSlugs: string[] = [],
): CaseStats[] => {
  const stats = new Map<string, CaseStats>();
  const ensure = (slug: string): CaseStats => {
    const existing = stats.get(slug);
    if (existing) return existing;
    const created = emptyStats(slug);
    stats.set(slug, created);
    return created;
  };
  for (const slug of knownSlugs) ensure(slug);

  for (const event of events) {
    // Scroll depth lives on its own location label (`case_<slug>_<depth>`).
    if (event.name === 'scroll_depth') {
      const label = String(event.label ?? '');
      if (label.startsWith(CASE_LOCATION_PREFIX)) {
        const match = label.match(/^(.*)_(\d+)$/);
        if (match) {
          const slug = match[1].slice(CASE_LOCATION_PREFIX.length);
          const entry = ensure(slug);
          entry.maxScroll = Math.max(entry.maxScroll, Number(match[2]));
        }
      }
      continue;
    }

    const slug = caseForEvent(event);
    if (!slug) continue;
    const entry = ensure(slug);

    switch (event.name) {
      case 'page_view':
        entry.views += 1;
        break;
      case 'cta_click':
        entry.ctaClicks += 1;
        break;
      case 'assessment_start':
        entry.assessments += 1;
        break;
      case 'generate_lead':
        entry.leads += 1;
        break;
      case 'schedule_appointment':
        entry.meetings += 1;
        break;
      default:
        break;
    }
  }

  return [...stats.values()]
    .map((entry) => ({
      ...entry,
      ctr: entry.views >= 100 && entry.ctaClicks > 0
        ? Math.round((entry.ctaClicks / entry.views) * 1000) / 1000
        : null,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
};

export interface CaseIntelligenceReport {
  /** Case with the most CTA interactions. */
  topInterest: string | null;
  /** Case with the most attributed leads. */
  topLeads: string | null;
  /** Case reaching the deepest scroll. */
  topScroll: string | null;
  /** Case with the most booked meetings. */
  topMeetings: string | null;
  /** Case with the strongest CTA rate (requires ≥ 100 views). */
  topConversion: string | null;
  stats: CaseStats[];
}

const argmax = (
  values: Array<{ slug: string; value: number; views: number }>,
): string | null => {
  const best = values.reduce<(typeof values)[number] | null>((acc, item) => {
    if (acc === null || item.value > acc.value) return item;
    if (item.value < acc.value) return acc;
    // Deterministic tie-break: more views first, then alphabetical.
    if (item.views > acc.views) return item;
    if (item.views < acc.views) return acc;
    return item.slug < acc.slug ? item : acc;
  }, null);
  return best && best.value > 0 ? best.slug : null;
};

/** Answers the four Phase 14 questions from raw events. */
export const getCaseIntelligence = (
  events: FunnelInputEvent[],
  knownSlugs: string[] = [],
): CaseIntelligenceReport => {
  const stats = getCaseStats(events, knownSlugs);
  const asRanks = (pick: (s: CaseStats) => number) =>
    stats.map((s) => ({ slug: s.slug, value: pick(s), views: s.views }));
  return {
    topInterest: argmax(asRanks((s) => s.ctaClicks)),
    topLeads: argmax(asRanks((s) => s.leads)),
    topScroll: argmax(asRanks((s) => s.maxScroll)),
    topMeetings: argmax(asRanks((s) => s.meetings)),
    topConversion: argmax(
      stats
        .filter((s) => s.ctr !== null)
        .map((s) => ({ slug: s.slug, value: s.ctr as number, views: s.views })),
    ),
    stats,
  };
};
