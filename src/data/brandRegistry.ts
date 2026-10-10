/**
 * Getboost 2027 — Wave 2A.4 · Brand Registry (Single Source of Truth).
 *
 * Every public metric claim and contact fact renders from this file. Before
 * this registry, three different project counts shipped simultaneously
 * (30+ on the homepage, 500+ in the shell and locales, 1500+ in About, SEO
 * and locales) alongside two contact emails (geral@ vs contacto@) — a
 * credibility defect, not a cosmetic one.
 *
 * Precedence:
 *   - A value changes HERE, once, and every consumer follows.
 *   - Code (ts/tsx) never re-states a number, phone, email or street address;
 *     it imports from this module.
 *   - Locale JSON files and the static shell cannot import TypeScript, so
 *     they carry the registry's canonical value verbatim — enforced by
 *     `src/tests/brand-consistency.test.ts`, which fails CI on any drift.
 *
 * Ownership: operator. Re-verify quarterly against delivery records.
 */

export const BRAND = {
  name: 'Getboost Digital',
  positioning: 'Agentes IA, Growth e Software que geram clientes',
  tagline: 'Tecnologia que faz o teu negócio crescer.',
} as const;

export const METRICS = {
  /**
   * Current-entity delivery count. The retired +500 / +1500 claims are
   * removed from every public surface; use this value everywhere.
   */
  projectsDelivered: {
    value: '30+',
    label: { pt: 'Projetos entregues', en: 'Projects delivered', es: 'Proyectos entregados' },
  },
  /** Experience claim. All public copy says 20+ — keep them identical. */
  yearsExperience: {
    value: '20+',
    label: { pt: 'Anos de experiência', en: 'Years of experience', es: 'Años de experiencia' },
  },
} as const;

export const CONTACT = {
  phone: {
    /** Human display, footer/contact-page format. */
    display: '+(351) 963 574 400',
    /** E.164 for tel: links and structured data. */
    e164: '+351963574400',
    /** wa.me format (no plus). */
    whatsapp: '351963574400',
  },
  /** Single business email. The retired geral@ address is banned by CI. */
  email: 'contacto@getboost.digital',
  address: {
    street: 'Rua Passeio Infante Dom Henrique, 22, Sala 33, 1º Piso',
    postalCode: '3080-042',
    locality: 'Figueira da Foz',
    country: 'Portugal',
    /** One-line form for footers and lists. */
    formatted: 'Rua Passeio Infante Dom Henrique, 22, Sala 33, 1º Piso, 3080-042 Figueira da Foz',
  },
} as const;

/**
 * Role addresses. Each serves one functional context (privacy DPO contact,
 * commercial routing, alerting, transactional sender, WhatsApp inbox, lead
 * routing) and is owned here so no surface re-types it.
 */
export const ROLE_EMAILS = {
  privacy: 'privacidade@getboost.digital',
  commercial: 'comercial@getboost.digital',
  ops: 'ops@getboost.digital',
  alerts: 'admin@getboost.digital',
  noReply: 'no-reply@getboost.digital',
  hello: 'hello@getboost.digital',
  routing: 'responsavel@getboost.digital',
} as const;

/**
 * The founder's personal address, used only where the invite/recipient is
 * the founder himself (calendar invites). Not a contact-page fact.
 */
export const FOUNDER = {
  name: 'Nuno Cruz',
  email: 'nunocruz@getboost.digital',
} as const;
