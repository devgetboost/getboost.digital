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
  | { name: 'page_view'; path: string; title: string; funnel_stage?: string };

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
  // 1. Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${event.name}:`, event);
  }

  // 2. Dispatch a custom DOM event (can be listened to by Google Tag Manager)
  const customEvent = new CustomEvent('lovable_analytics', {
    detail: event,
    bubbles: true
  });
  window.dispatchEvent(customEvent);

  // 3. Track in dataLayer if GTM is present
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: event.name,
      ...event
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
    const payload = {
      event,
      click_id,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...body,
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
    trackEvent({ name: 'form_submission', category, label, funnel_stage: 'conversion', data });

    // Explicit conversion events for GA4
    if (label.includes('success')) {
      trackEvent({ name: 'generate_lead', category, label, data });
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
    trackEvent({ name: 'schedule_appointment', category, label, data });
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
    trackEvent({ name: 'page_view', path, title, funnel_stage: funnelStage })
};
