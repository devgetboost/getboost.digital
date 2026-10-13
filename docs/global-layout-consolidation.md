# R19.4 — GLOBAL LAYOUT CONSOLIDATION

**Status:** ✅ **COMPLETE** (Implemented in Waves 3A, 3B, 3E)  
**Scope:** All pages share unified layout shell — Header V2, Footer V2, Grid Overlay, Container, Section rhythm  
**Governance:** Frozen — enforced by design system tokens + CI guards

---

## UNIFIED LAYOUT ARCHITECTURE

Every public page shares the same layout shell:

```
<Layout>
  <Header />           // Header V2 — sticky, mega-menu, role-aware
  <main className="flex-1">
    {children}        // Page content — uses design system surfaces
  </main>
  <Footer />           // Footer V2 — complete IA map, newsletter, products
</Layout>
```

**No page may define its own header, footer, or global container.**

---

## HEADER V2 (Frozen)

**File:** `src/components/Header.tsx`  
**Route:** All public pages (via Layout)

### Features (Frozen)
- **Sticky, in-flow** — no top offset needed on pages (R18.5)
- **Shrink on scroll** — `h-20 → h-[68px]`, shadow + border
- **Mega Menu** — 4 pillars (AI, Automation, Software, Growth) + Products + Resources + Company
- **Mobile-first** — fullscreen overlay, accordion sections
- **Role-aware** — internal routes (`/dashboard`, `/colaborador`) hidden from public nav
- **Language switcher** — minimal (desktop), inline (mobile)
- **Booking CTA** — always visible, brand gradient
- **Scroll detection** — `window.scrollY > 24` triggers shrink

### Mega Menu Structure (Frozen)

| Pillar | Items (Canonical Slugs) |
|--------|------------------------|
| **AI** | `/agentes-ia`, `/solucoes/bots-whatsapp-ia`, `/crm-sales-intelligence` |
| **Automation** | `/solucoes/integracoes-erp-crm`, `/solucoes/funis-vendas`, `/solucoes/sistemas-gestao-pmes`, `/solucoes/email-marketing` |
| **Software** | `/solucoes/desenvolvimento-web`, `/solucoes/desenvolvimento-mobile`, `/solucoes/desenvolvimento-saas`, `/solucoes/ux-ui-design`, `/solucoes/mvp-30-dias` |
| **Growth** | `/solucoes/marketing-digital`, `/solucoes/paid-media`, `/solucoes/seo-geo-webmcp`, `/solucoes/gestao-redes-sociais`, `/solucoes/copywriting-conteudo`, `/solucoes/branding-identidade`, `/solucoes/landing-pages`, `/solucoes/video-fotografia` |

**All 20 canonical `/solucoes/*` slugs reachable via mega menu (CI-guarded).**

---

## FOOTER V2 (Frozen)

**File:** `src/components/Footer.tsx`  
**Route:** All public pages (via Layout)

### Features (Frozen)
- **Dark premium** — `bg-[hsl(0,0%,5%)]`, ambient grid + radial glow
- **Complete IA map** — all pillars, work, insights, products, contact
- **Newsletter capture** — `subscribeNewsletter` (Clean V1), consent-gated
- **Market switcher** — mirrors header, drives URL + `LanguageManager`
- **Products strip** — complete catalog (routable = link, institutional = span)
- **Contact/Address block** — `CONTACT` from brand registry
- **Legal links** — privacy, cookies, disputes, complaints
- **Ambient grid + radial glow** — matches homepage aesthetic

### Footer Columns (Frozen)

| Column | Links |
|--------|-------|
| **Empresa** | `/sobre-nos`, `/equipa`, `/carreira` |
| **Trabalho** | `/portfolio`, `/casos-de-sucesso` |
| **Insights** | `/blog`, `/resources`, `/podcast`, `/academy`, `/webinars` |
| **Newsletter** | Name + Email + Consent → `subscribeNewsletter` |

---

## GRID OVERLAY (Frozen)

**Class:** `.gb-grid-overlay`  
**Usage:** All hero sections, CTA bands, footer

```css
.gb-grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  background-image: 
    linear-gradient(var(--gb-sand-800) 1px, transparent 1px),
    linear-gradient(90deg, var(--gb-sand-800) 1px, transparent 1px);
  background-size: 64px 64px;
}
```

**Usage:** Every hero section, CTA band, footer. **Never decorative noise** — structural motif only.

---

## CONTAINER & SECTION RHYTHM (Frozen)

### Container (`.gb-container`)
```css
.gb-container {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: var(--gb-space-6);  /* 24px */
}
@media (min-width: 768px) {
  .gb-container { padding-inline: var(--gb-space-12); }  /* 48px */
}
```

### Section Rhythm (`.gb-section`)
```css
.gb-section {
  padding-block: var(--gb-space-16);  /* 64px */
}
@media (min-width: 768px) {
  .gb-section { padding-block: var(--gb-space-24); }  /* 96px */
}
```

**Usage:** All pages MUST wrap content in `<div className="gb-container">` inside sections with `.gb-section`.  
**No page may define custom `max-w-7xl mx-auto px-6 md:px-12` or `py-24 md:py-32`.**

---

## HAIRLINES (Frozen)

```css
/* Structural rules — never decorative */
.gb-hairline { height: 1px; background: var(--gb-sand-200); border: 0; }

.gb-hairline-accent {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--gb-brand-500), transparent);
  opacity: 0.4;
}
```

**Usage:** After hero (`.gb-hairline-accent`), between footer sections (`border-t border-white/10`).

---

## SURFACE HIERARCHY (Frozen)

| Level | Class | Background | Border | Shadow | Use Case |
|-------|-------|------------|--------|--------|----------|
| Page | `.gb-surface-page` | `--gb-canvas-base` | — | — | Page base + grid overlay |
| Section | `.gb-surface-section` | `--gb-canvas-section` | — | — | Alternating sections |
| Subtle | `.gb-surface-subtle` | `--gb-canvas-subtle` | — | — | Subtle alternation |
| Card | `.gb-surface-card` | `--gb-canvas-base` | `--gb-line` | `--gb-shadow-rest` | Standard card |
| Elevated | `.gb-surface-card-elevated` | `--gb-canvas-base` | `--gb-sand-200` | `--gb-shadow-rest` | Hover lift |
| Pillar | `.gb-surface-pillar-card` | `--gb-canvas-base` | `--gb-sand-200` | `--gb-shadow-rest` | 4px top accent |
| Feature | `.gb-surface-feature` | Gradient | `--gb-line` | `--gb-shadow-md` | Feature highlights |

**No page may define custom `bg-white`, `border-border/40`, `shadow-xl` combinations.**

---

## CTA SYSTEM (Frozen)

### Button Variants (via `Button` + `StandardCTA`)

| Variant | Class | Use Case |
|---------|-------|----------|
| Default | `bg-primary text-primary-foreground` | Primary actions |
| Outline | `border-2 border-primary bg-transparent text-primary` | Secondary actions |
| Ghost | `text-foreground hover:bg-accent` | Tertiary/links |
| Link | `text-primary font-semibold underline` | Inline links |

### CTA Band (`.gb-cta-band`)
```css
.gb-cta-band {
  background: var(--gb-canvas-inverse);  /* Near-black */
  color: var(--gb-ink-inverse);
  border-radius: var(--gb-radius-card);
  padding: var(--gb-space-16) var(--gb-space-8);
}
```
**Usage:** Final CTA on every page. Single conversion path — no competing CTAs.

---

## TYPOGRAPHY HIERARCHY (Frozen)

| Element | Class | Usage |
|---------|-------|-------|
| Display | `.gb-text-display` | Hero headlines |
| H1 | `.gb-text-h1` | Page titles |
| H2 | `.gb-text-h2` | Section titles |
| H3 | `.gb-text-h3` | Subsection titles |
| Body | `.gb-text-body` | Body copy |
| Small | `.gb-text-small` | Captions, meta |
| Eyebrow | `.gb-eyebrow` | Category labels, mono uppercase |

**Fluid clamps** keep frozen values at desktop — no manual breakpoint overrides.

---

## MOTION SYSTEM (Frozen — R18.7)

| Pattern | Implementation | Reduced Motion |
|---------|----------------|----------------|
| `fadeUp` | `opacity 0→1`, `y 30→0`, `duration 0.6`, `ease [0.16,1,0.3,1]` | Instant |
| `Reveal` | `whileInView` once, staggered via `custom` index | Instant |
| `Float` | `y: [0,-8,0]`, `duration 5-6s`, `repeat: Infinity` | **Disabled** |
| Card Lift | `translateY(-6px) scale(1.02)` + glow | Instant |
| Link Underline | `scaleX(0→1)`, `origin: left`, `180ms` | Instant |
| Float Loop | `y: [0,-8,0]`, `5-6s`, `repeat: Infinity` | **Disabled** |
| Parallax | `useScroll`/`useTransform` subtle `y` | **Disabled** |
| CTA Drift | Ellipse `x: [-50%,-46%,-50%]`, `14s`, `∞` | **Disabled** |

**All motion respects `useReducedMotion()` — animations become instant or disabled.**

---

## RESPONSIVE BREAKPOINTS (Frozen)

| Breakpoint | Tailwind | Usage |
|------------|----------|-------|
| `sm` | `640px` | 2-col grids |
| `md` | `768px` | Tablet — container padding, 2-col grids |
| `lg` | `1024px` | Desktop — 3-4 col grids, full nav |
| `xl` | `1280px` | Container max-width |
| `2xl` | `1400px` | Wide screens |

**No custom breakpoints.** All pages use these exclusively.

---

## Z-INDEX SCALE (Frozen)

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Header | `50` | Sticky header |
| Mega Menu | `50` (absolute) | Desktop mega panels |
| Mobile Menu | `50` (fixed) | Fullscreen overlay |
| Modal/Dialog | `50` (portal) | Dialogs, audit modal |
| Toast | `50` (sonner) | Notifications |
| Tooltip | `50` | Tooltips |

**No custom z-index values in page components.**

---

## CI ENFORCEMENT (Frozen)

| Check | File | Failure If |
|-------|------|------------|
| Layout shell | `Layout.tsx` | Missing Header/Footer, custom wrapper |
| Container usage | All pages | Missing `gb-container` in sections |
| Section rhythm | All pages | Hardcoded `py-24`, `py-32`, `max-w-7xl` |
| Header/Footer | All pages | Missing Header/Footer in Layout |
| Grid overlay | Hero sections | Missing `.gb-grid-overlay` |
| Hairline accent | After hero | Missing `.gb-hairline-accent` |
| Surface classes | All cards/sections | Hardcoded `bg-white`, `border-border/40` |
| Spacing | All sections | Hardcoded `py-24`, `px-6` |
| Container | All pages | Hardcoded `max-w-7xl mx-auto px-6` |

---

## MIGRATION CHECKLIST (Per Page)

```
[ ] Page wraps content in Layout (Header + Footer via Layout)
[ ] All sections use .gb-section (not py-24/py-32)
[ ] All content wrapped in .gb-container (not max-w-7xl mx-auto)
[ ] Hero uses .gb-surface-page + .gb-grid-overlay
[ ] Hero followed by .gb-hairline-accent
[ ] Cards use .gb-surface-card / .gb-surface-card-elevated
[ ] No hardcoded bg-white, border-border/40, shadow-xl
[ ] No hardcoded py-24, py-32, px-6, max-w-7xl
[ ] CTA band uses .gb-cta-band
[ ] Hairlines use .gb-hairline / .gb-hairline-accent
[ ] Motion respects useReducedMotion()
```

---

*Global Layout consolidated in Waves 3A, 3B, 3E. All pages now share Header V2, Footer V2, Container, Section rhythm, Grid overlay, Hairlines, Surface hierarchy. No page may deviate.*