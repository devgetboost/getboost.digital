import type { FunnelInputEvent } from './funnel-intelligence';
import { getWaitlistProducts, type WaitlistProduct } from '../data/product-demand';

/**
 * R20.8 — Waitlist Engine (Fase 6).
 *
 * Reusable flow: Interesse → Waitlist → Lead → Produto Futuro. It exists
 * for products that legitimately have NO landing page yet (Alojify, Safely,
 * Guia Cities, Descobre Quem Tu És). It creates no fake page and no fake
 * product: the engine only produces state, tracking payloads and stats, and
 * an operator decides where the capture surface lives.
 */

export const WAITLIST_STAGES = ['NOT_JOINED', 'WAITLISTED', 'CAPTURED', 'AVAILABLE'] as const;

export type WaitlistStage = (typeof WAITLIST_STAGES)[number];

/** Label per stage (shipped copy only — no product promises). */
export const WAITLIST_STAGE_LABEL: Record<WaitlistStage, string> = {
  NOT_JOINED: 'Sem inscrição',
  WAITLISTED: 'Em waitlist',
  CAPTURED: 'Lead capturado',
  AVAILABLE: 'Disponível',
};

/** Pure state transition from observed interest counts. */
export const waitlistStage = (input: { interest: number; joined: number; captured: number; available: boolean }): WaitlistStage => {
  if (input.available) return 'AVAILABLE';
  if (input.captured > 0) return 'CAPTURED';
  if (input.joined > 0) return 'WAITLISTED';
  if (input.interest > 0) return 'NOT_JOINED';
  return 'NOT_JOINED';
};

export interface WaitlistEventPayload {
  product: string;
  stage: 'interest' | 'waitlist' | 'lead' | 'booking';
  location: string;
}

/**
 * Builds the analytics payload for a waitlist action (Fase 7 taxonomy:
 * `product_interest` / `product_waitlist` / `product_lead`). Only slugs and
 * locations — never contact data; capture happens in the lead form itself.
 */
export const waitlistPayload = (
  product: string,
  stage: WaitlistEventPayload['stage'],
  location: string,
): WaitlistEventPayload => ({ product, stage, location });

export interface WaitlistStats {
  product: WaitlistProduct;
  interest: number;
  joined: number;
  captured: number;
  stage: WaitlistStage;
  /** Share of interested visitors that joined, null below 20 interests. */
  joinRate: number | null;
}

const actionFrom = (event: FunnelInputEvent): string => {
  const action = event.data?.['action'];
  if (typeof action === 'string' && action.length > 0) return action;
  if (typeof event.label === 'string') return event.label.split('_').pop() ?? '';
  return '';
};

/** Per-product waitlist funnel from the event stream. */
export const getWaitlistStats = (events: FunnelInputEvent[]): WaitlistStats[] => {
  const rows = new Map<string, { interest: number; joined: number; captured: number }>();
  const bump = (slug: string, field: 'interest' | 'joined' | 'captured') => {
    const row = rows.get(slug) ?? { interest: 0, joined: 0, captured: 0 };
    row[field] += 1;
    rows.set(slug, row);
  };

  for (const event of events) {
    const product = event.data?.['product'];
    if (typeof product !== 'string' || product.length === 0) continue;
    if (event.name === 'product_interaction') {
      const action = actionFrom(event);
      if (action === 'interest' || action === 'click') bump(product, 'interest');
      if (action === 'waitlist') bump(product, 'joined');
    }
    if (event.name === 'generate_lead') bump(product, 'captured');
  }

  return getWaitlistProducts().map((product) => {
    const row = rows.get(product.slug) ?? { interest: 0, joined: 0, captured: 0 };
    // A product with a landing page is not a waitlist candidate; AVAILABLE
    // marks the moment its public surface exists.
    const stage = waitlistStage({
      interest: row.interest,
      joined: row.joined,
      captured: row.captured,
      available: false,
    });
    return {
      product,
      interest: row.interest,
      joined: row.joined,
      captured: row.captured,
      stage,
      joinRate: row.interest >= 20 && row.joined > 0
        ? Math.round((row.joined / row.interest) * 1000) / 1000
        : null,
    };
  });
};

/** Waitlist candidates with no signal yet — the Fase 6 backlog, not a bug. */
export const getWaitlistBacklog = (stats: WaitlistStats[]): WaitlistStats[] =>
  stats.filter((row) => row.interest === 0 && row.joined === 0 && row.captured === 0);
