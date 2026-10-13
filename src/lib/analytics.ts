/**
 * Analytics utility for tracking events across the application.
 * Currently uses Custom Events that can be picked up by GTM or other scripts.
 */

/**
 * Normalizes and sanitizes UTM parameters.
 * - Max length: 100 chars
 * - Removes non-alphanumeric chars except - and _
 * - Converts to lowercase
 */
export const sanitizeUTM = (value: string | null): string => {
  if (!value) return 'direct';
  
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_]/g, '') // Sanitize
    .substring(0, 100); // Limit size
};

type AnalyticsEvent =
  | { name: 'form_submission'; category: string; label: string; funnel_stage?: string; data?: any }
  | { name: 'generate_lead'; category: string; label: string; data?: any }
  | { name: 'schedule_appointment'; category: string; label: string; data?: any }
  | { name: 'cta_click'; category: string; label: string; funnel_stage?: string; data?: any }
  | { name: 'whatsapp_click'; category: string; label: string; funnel_stage?: string; data?: any }
  | { name: 'page_view'; path: string; title: string; funnel_stage?: string }
  // R20.1 — additive events. Existing names are never renamed (downstream
  // GA4/GTM/CRM dashboards depend on them); new events follow
  // `category_action_location` via the helpers below.
  | { name: 'scroll_depth'; category: string; label: string; data?: any }
  | { name: 'outbound_click'; category: string; label: string; data?: any }
  | { name: 'form_step'; category: string; label: string; funnel_stage?: string; data?: any }
  | { name: 'product_interaction'; category: string; label: string; data?: any };

/**
 * R20.1 — PII scrub. Analytics must never capture personal data (emails,
 * phones, messages, form contents). Applied to every `data` payload at
 * dispatch time AND before the CRM forward, so a future call site cannot
 * leak PII even if it passes too much. Keys matched case-insensitively;
 * nested objects are scrubbed recursively; arrays mapped.
 */
const PII_KEYS = new Set([
  'email', 'e-mail', 'emailaddress', 'phone', 'telephone', 'tel', 'phonenumber',
  'message', 'mensagem', 'company', 'empresa', 'name', 'nome', 'firstname',
  'lastname', 'fullname', 'address', 'morada', 'website', 'site', 'budget',
  'timeline', 'challenges', 'consent',
]);

const isPiiKey = (key: string): boolean =>
  PII_KEYS.has(key.toLowerCase().replace(/[_-]/g, ''));

export const scrubAnalyticsData = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(scrubAnalyticsData);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (isPiiKey(key)) continue;
      out[key] = scrubAnalyticsData(entry);
    }
    return out;
  }
  return value;
};

/** True when `?gb_debug=analytics` is present — verbose console output, no prod impact. */
const isAnalyticsDebug = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get('gb_debug') === 'analytics';
  } catch {
    return false;
  }
};

import { getIntelligenceReport, type FunnelInputEvent } from './funnel-intelligence';
import { getCaseIntelligence } from './case-intelligence';
import type { ProductAction } from '../data/product-demand';
import { buildProductDemandReport } from './product-demand-report';

/** In-memory ring buffer of dispatched events (debug only, never persisted). */
const debugLog: Array<{ at: string; event: AnalyticsEvent }> = [];
export const getAnalyticsDebugLog = (): Array<{ at: string; event: AnalyticsEvent }> => [...debugLog];

/** Rolling funnel report for the debug console (internal use, debug-gated). */
export const getFunnelDebugReport = () => {
  const events = debugLog.map((entry) => entry.event as FunnelInputEvent);
  return {
    ...getIntelligenceReport(events),
    // R20.7 Phase 14 — which cases draw interest, leads, scroll and meetings.
    cases: getCaseIntelligence(events),
    // R20.8 — product demand rankings (interest/leads/meetings/potential).
    demand: buildProductDemandReport(events).ranking,
  };
};

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export type UTMs = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const UTM_STORAGE_KEY = 'gb_utms';

/**
 * Reads UTMs from the current URL and persists them in sessionStorage on first
 * visit. Returns the stored UTMs (or an empty object if none captured).
 */
export const getStoredUTMs = (): UTMs => {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const fresh: UTMs = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) fresh[k] = sanitizeUTM(v);
    }
    if (Object.keys(fresh).length > 0) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UTMs) : {};
  } catch {
    return {};
  }
};

/**
 * Infers a sensible fallback origin/campaign from the referrer when no UTMs
 * were captured, so every WhatsApp message still carries attribution.
 */
export const getFallbackUTMs = (): Required<Pick<UTMs, 'utm_source' | 'utm_medium' | 'utm_campaign'>> => {
  if (typeof document === 'undefined') {
    return { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'site_organico' };
  }
  const ref = document.referrer;
  if (!ref) {
    return { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'site_organico' };
  }
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    const sameHost = typeof window !== 'undefined' && host === window.location.hostname.replace(/^www\./, '');
    if (sameHost) {
      return { utm_source: 'site', utm_medium: 'internal', utm_campaign: 'site_organico' };
    }
    const search = /google\.|bing\.|duckduckgo\.|yahoo\./.test(host);
    const social = /facebook\.|instagram\.|linkedin\.|t\.co|twitter\.|x\.com|youtube\.|tiktok\./.test(host);
    return {
      utm_source: sanitizeUTM(host.split('.')[0]),
      utm_medium: search ? 'organic' : social ? 'social' : 'referral',
      utm_campaign: search ? 'seo' : social ? 'social_organico' : 'referral',
    };
  } catch {
    return { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'site_organico' };
  }
};

/**
 * R20.17 — stamps conversion payloads with the session's UTMs (or inferred
 * fallbacks) so the dashboard can break leads down by source/medium/campaign.
 * UTMs are marketing parameters, never PII; the central scrub keeps them.
 */
const withAttribution = (data?: Record<string, unknown>): Record<string, unknown> => {
  const stored = getStoredUTMs();
  const utms = Object.keys(stored).length > 0 ? stored : getFallbackUTMs();
  return { ...(data || {}), utms };
};

/**
 * Builds a wa.me URL for a given phone (digits only) and message, appending
 * captured UTMs (or inferred fallbacks) to the pre-filled text so leads can be
 * attributed inside WhatsApp CRMs.
 */
export const buildWhatsAppUrl = (phoneDigits: string, message = ''): string => {
  const stored = getStoredUTMs();
  const utms: UTMs = Object.keys(stored).length > 0 ? stored : getFallbackUTMs();
  const utmSuffix = Object.entries(utms)
    .map(([k, v]) => `${k}=${v}`)
    .join(' | ');
  const finalMsg = utmSuffix
    ? `${message}${message ? '\n\n' : ''}[origem: ${utmSuffix}]`
    : message;
  const qs = finalMsg ? `?text=${encodeURIComponent(finalMsg)}` : '';
  return `https://wa.me/${phoneDigits}${qs}`;
};

export const trackEvent = (event: AnalyticsEvent) => {
  // R20.1 — scrub PII from every payload before it leaves the browser.
  const safeEvent = ('data' in event && event.data !== undefined
    ? { ...event, data: scrubAnalyticsData(event.data) }
    : event) as AnalyticsEvent;

  // 1. Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${safeEvent.name}:`, safeEvent);
  }

  // R20.1 — debug mode: verbose, structured output + ring buffer. Param-gated.
  if (typeof window !== 'undefined' && isAnalyticsDebug()) {
    debugLog.push({ at: new Date().toISOString(), event: safeEvent });
    if (debugLog.length > 100) debugLog.shift();
    console.info(
      `%c[analytics:debug] ${safeEvent.name}`,
      'font-weight:bold',
      JSON.stringify(safeEvent, null, 2),
    );
    // R20.2 — rolling intelligence on every conversion (internal use only).
    if (
      safeEvent.name === 'form_submission' ||
      safeEvent.name === 'schedule_appointment' ||
      safeEvent.name === 'generate_lead'
    ) {
      console.info(
        '%c[analytics:intelligence] funnel report',
        'font-weight:bold',
        JSON.stringify(getFunnelDebugReport(), null, 2),
      );
    }
    (window as unknown as { __gbFunnelReport?: () => unknown }).__gbFunnelReport =
      getFunnelDebugReport;
  }

  // 2. Dispatch a custom DOM event (can be listened to by Google Tag Manager)
  const customEvent = new CustomEvent('lovable_analytics', {
    detail: safeEvent,
    bubbles: true
  });
  window.dispatchEvent(customEvent);

  // 3. Track in dataLayer if GTM is present
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: safeEvent.name,
      ...safeEvent
    });
  }
};

/**
 * Fire-and-forget forward of a conversion to the CRM webhook. Failures never
 * block the calling UI (WhatsApp open, form submit, etc).
 */
const CLICK_ID_STORAGE_KEY = 'gb_click_id';
const CLICK_ID_TTL_MS = 30 * 60 * 1000; // 30 min

const genClickId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Returns a click_id, reusing a persisted one within TTL so a WhatsApp click
 * and a subsequent form submission share the same id for CRM deduplication.
 * Pass `forceNew` on the click itself to start a fresh attribution window.
 */
export const getOrCreateClickId = (forceNew = false): string => {
  if (typeof window === 'undefined') return genClickId();
  try {
    if (!forceNew) {
      const raw = sessionStorage.getItem(CLICK_ID_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { id: string; ts: number };
        if (parsed?.id && Date.now() - parsed.ts < CLICK_ID_TTL_MS) {
          console.debug('[analytics] click_id reused', parsed.id);
          return parsed.id;
        }
      }
    }
    const id = genClickId();
    sessionStorage.setItem(CLICK_ID_STORAGE_KEY, JSON.stringify({ id, ts: Date.now() }));
    console.debug('[analytics] click_id created', id);
    return id;
  } catch {
    return genClickId();
  }
};

const forwardToCRM = (
  event: 'whatsapp_conversion' | 'form_conversion',
  body: Record<string, unknown>,
) => {
  try {
    const click_id = getOrCreateClickId();
    // R20.17 — explicit touch fields so the CRM can answer source/medium/
    // campaign + first/latest touch + landing page without joining the
    // journey array. Paths only, never PII (same guarantee as the journey).
    const journey = getJourney();
    const payload = {
      event,
      click_id,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      first_touch: journey[0] ?? getJourneyOrigin(),
      last_touch: journey[journey.length - 1] ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      landing_page: journey[journey.length - 1] ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      ...body,
      // R20.1 — the forward carries attribution only, never form contents.
      data: scrubAnalyticsData((body as { data?: unknown }).data ?? {}),
    };
    console.debug('[analytics] forwardToCRM →', event, { click_id, location: (body as any).location, template: (body as any).template });
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.functions
        .invoke('crm-whatsapp-lead', { body: payload })
        .then((res) => console.debug('[analytics] CRM forward ok', click_id, res?.data))
        .catch((err) => console.warn('[analytics] CRM forward failed', click_id, err));
    });
  } catch (err) {
    console.warn('[analytics] CRM forward init failed', err);
  }
};



export const analytics = {
  /**
   * Track a form submission. Pass `whatsappTemplate` when the form is tied to
   * a WhatsApp CTA (e.g. lead magnet that also opens WhatsApp) so the CRM can
   * correlate the message template with the form conversion.
   */
  trackForm: (
    category: string,
    label: string,
    data?: any,
    whatsappTemplate?: string,
  ) => {
    trackEvent({ name: 'form_submission', category, label, funnel_stage: 'conversion', data: withAttribution(data) });

    // Explicit conversion events for GA4
    if (label.includes('success')) {
      trackEvent({ name: 'generate_lead', category, label, data: withAttribution(data) });
    }

    // Forward every form submission to the CRM with UTMs + optional template.
    const stored = getStoredUTMs();
    const utms = Object.keys(stored).length > 0 ? stored : getFallbackUTMs();
    forwardToCRM('form_conversion', {
      location: `${category}:${label}`,
      template: whatsappTemplate ?? 'form',
      utms,
      data: data || {},
    });
  },

  trackBooking: (category: string, label: string, data?: any) => {
    trackEvent({ name: 'schedule_appointment', category, label, data: withAttribution(data) });
  },

  trackClick: (category: string, label: string, funnelStage: 'awareness' | 'consideration' | 'conversion' = 'consideration', data?: any) =>
    trackEvent({ name: 'cta_click', category, label, funnel_stage: funnelStage, data }),

  /**
   * Track a click on any WhatsApp button/link.
   * @param location  Where the click originated (e.g. 'contact_hero', 'chat_widget').
   * @param template  Message template id from WHATSAPP_MESSAGES (e.g. 'generic', 'droneCalculator').
   * @param data      Extra metadata to attach.
   */
  trackWhatsApp: (location: string, template: string, data?: any) => {
    // Mint a fresh click_id at the moment of the click so any downstream
    // form submission in the same session inherits it via sessionStorage.
    const click_id = getOrCreateClickId(true);
    const stored = getStoredUTMs();
    const utms = Object.keys(stored).length > 0 ? stored : getFallbackUTMs();
    const payload = { template, click_id, ...utms, ...(data || {}) };
    trackEvent({
      name: 'whatsapp_click',
      category: 'whatsapp',
      label: location,
      funnel_stage: 'conversion',
      data: payload,
    });
    trackEvent({ name: 'generate_lead', category: 'whatsapp', label: location, data: payload });

    forwardToCRM('whatsapp_conversion', {
      location,
      template,
      utms,
      data: data || {},
    });
  },


  trackPageView: (path: string, title: string, funnelStage: 'awareness' | 'consideration' | 'conversion' = 'awareness') =>
    trackEvent({ name: 'page_view', path, title, funnel_stage: funnelStage }),

  /**
   * R20.1 — scroll depth. Fire once per threshold per page load.
   * @param location  Page or section id (e.g. 'homepage', 'ai_agents').
   * @param depth     25 | 50 | 75 | 100.
   */
  trackScrollDepth: (location: string, depth: 25 | 50 | 75 | 100, path?: string) =>
    trackEvent({
      name: 'scroll_depth',
      category: 'engagement',
      label: `${location}_${depth}`,
      data: { depth, path: path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined) },
    }),

  /**
   * R20.1 — outbound clicks (phone, email, external, calendar).
   * WhatsApp keeps its dedicated event + CRM forward — never double-count it here.
   */
  trackOutbound: (
    kind: 'phone' | 'email' | 'external' | 'calendar',
    location: string,
    data?: Record<string, unknown>,
  ) =>
    trackEvent({
      name: 'outbound_click',
      category: 'outbound',
      label: `${kind}_${location}`,
      funnel_stage: 'consideration',
      data: { kind, ...(data || {}) },
    }),

  /**
   * R20.1 — form lifecycle (start/progress/submit/abandon).
   * success/error keep their existing dedicated events; this covers the rest.
   */
  trackFormStep: (
    form: 'booking' | 'contact' | 'demo' | 'consultor' | 'newsletter',
    step: 'start' | 'progress' | 'submit' | 'abandon',
    data?: Record<string, unknown>,
  ) =>
    trackEvent({
      name: 'form_step',
      category: form,
      label: `${form}_${step}`,
      funnel_stage: step === 'abandon' ? 'consideration' : 'conversion',
      data: data || {},
    }),

  /**
   * R20.1 — product interest. View coverage comes from page views on the
   * hub/landing routes; click/interest fire on card interactions.
   *
   * R20.8 (Fase 7) widens the action union to the official product
   * taxonomy — `product_view | product_click | product_interest |
   * product_assessment | product_waitlist | product_lead | product_booking`
   * — carried as `data.action` under the SAME `product_interaction` event.
   * Existing names are never renamed: `click` and `interest` keep firing
   * exactly as before, so downstream GA4/GTM/CRM reports keep working.
   */
  trackProduct: (product: string, action: ProductAction, location: string) =>
    trackEvent({
      name: 'product_interaction',
      category: 'products',
      label: `${product}_${action}`,
      funnel_stage: action === 'booking' || action === 'lead' ? 'conversion' : 'consideration',
      data: { product, action, location },
    }),

  /**
   * R20.8 — waitlist join for products without a landing page (Fase 6).
   * Pure signal: slug + location only, never contact data.
   */
  trackWaitlist: (product: string, location: string) =>
    trackEvent({
      name: 'product_interaction',
      category: 'products',
      label: `${product}_waitlist`,
      funnel_stage: 'consideration',
      data: { product, action: 'waitlist', location, waitlist: true },
    }),

  /**
   * R20.8 — product demand capture: assessment open/complete, lead and
   * booking events stamped with the product slug so the demand funnel
   * (Fase 8) can attribute without identity. Scores/ids only, no PII.
   */
  trackProductDemand: (
    product: string,
    action: Extract<ProductAction, 'assessment' | 'lead' | 'booking' | 'view'>,
    location: string,
    data?: Record<string, unknown>,
  ) =>
    trackEvent({
      name: 'product_interaction',
      category: 'products',
      label: `${product}_${action}`,
      funnel_stage: action === 'lead' || action === 'booking' ? 'conversion' : 'consideration',
      data: { product, action, location, ...(data || {}) },
    }),

  /**
   * R20.4 — lead-magnet assessment lifecycle. Event names are fixed by the
   * brief (assessment_start/progress/complete/lead_capture/result_view);
   * category/label follow the taxonomy. Payloads carry scores and tiers
   * only — never lead PII (the capture call below carries the contact).
   */
  trackAssessment: (
    assessment: string,
    event: 'start' | 'progress' | 'complete' | 'lead_capture' | 'result_view',
    data?: Record<string, unknown>,
  ) =>
    trackEvent({
      name: `assessment_${event}`,
      category: 'lead_magnet',
      label: `${assessment}_${event}`,
      funnel_stage: event === 'lead_capture' ? 'conversion' : 'consideration',
      data: event === 'lead_capture' ? { assessment, ...withAttribution(data) } : { assessment, ...(data || {}) },
    }),
};

/**
 * R20.1 — funnel attribution journey. Records visited paths (never query
 * strings, never PII) in sessionStorage, capped at 20 entries. Attached
 * to conversion payloads so the CRM can answer "which path generated
 * this lead" without cookies or fingerprinting.
 */
const JOURNEY_STORAGE_KEY = 'gb_journey';
const JOURNEY_MAX_STEPS = 20;

export const recordJourneyStep = (path: string): void => {
  try {
    const clean = path.split('?')[0].split('#')[0] || '/';
    const raw = sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    const steps: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (steps[steps.length - 1] === clean) return; // no consecutive duplicates
    steps.push(clean);
    while (steps.length > JOURNEY_MAX_STEPS) steps.shift();
    sessionStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(steps));
  } catch {
    // storage unavailable — attribution degrades silently, never blocks
  }
};

export const getJourney = (): string[] => {
  try {
    const raw = sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    const steps = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(steps) ? steps.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
};

/** First page of the session — the funnel origin ("de onde vêm"). */
export const getJourneyOrigin = (): string => getJourney()[0] ?? 'direct';
