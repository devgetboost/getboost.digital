# R19.8 — WORK / PORTFOLIO MIGRATION

**Status:** ✅ **COMPLETE** (Implemented in Wave 3E)  
**Scope:** `/work`, `/portfolio`, `/casos-de-sucesso`, `/portfolio/:id`  
**Governance:** Frozen design system tokens

---

## MIGRATION SUMMARY

| Route | Page Component | Before | After | Status |
|-------|----------------|--------|-------|--------|
| `/work` | Work.tsx | Legacy | New design system | ✅ Done |
| `/portfolio` | Portfolio.tsx | Legacy | New design system | ✅ Done |
| `/casos-de-sucesso` | CasosSucesso.tsx | Legacy | New design system | ✅ Done |
| `/portfolio/:id` | PortfolioDetail.tsx | Legacy | New design system | ✅ Done |

---

## WORK PAGE (`/work`)

### Before (Legacy)
- Custom hero with dark background
- Horizontal scroll carousel for projects
- Old card styles with `bg-white dark:bg-card`

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay` + `gb-hairline-accent`
- **Authority Strip:** 4 stats using `METRICS.projectsDelivered.value`
- **Execution Chain:** `gb-flow-connector` + pillar chips (spans only, no links)
- **Cases Grid:** `gb-surface-card gb-card-lift` with `Reveal` animation
- **Products Spotlight:** `PRODUCTS.filter(p => p.kind === 'saas' && p.to)` with `gb-surface-card`
- **Execution Model:** Pillar chain with `gb-flow-connector` (spans only)
- **Why Getboost:** Comparison cards with `gb-surface-card`
- **CTA Bands:** `gb-cta-band` with `StandardCTA` + `CommercialAuditModal`

---

## PORTFOLIO PAGE (`/portfolio`)

### Before (Legacy)
- `PageHero` component
- Carousel for featured projects
- Old card styles

### After (New Design System)
- **Hero:** Light premium, `gb-surface-page` + `gb-grid-overlay`
- **Authority Strip:** Verifiable facts (products, pillars, services, markets)
- **Cases Grid:** `gb-surface-card gb-card-lift` with `Reveal` animation
- **Products Spotlight:** Own products from catalog
- **Execution Chain:** Pillar spans with `gb-flow-connector` (no links)
- **Why Getboost:** Comparison cards
- **CTA Bands:** `gb-cta-band` with `StandardCTA`

---

## PORTFOLIO DETAIL (`/portfolio/:id`)

### Before (Legacy)
- Carousel with Embla
- Old hero strategy
- `CardHoverReveal` component

### After (New Design System)
- **Hero:** Light premium, `gb-surface-page`, `gb-grid-overlay`
- **Back Link:** `gb-link-more` to `/portfolio`
- **Hero Visual:** Hero image with `gb-card !shadow-lg`
- **Context Chips:** Category, Client, Year
- **Sections:** Desafio → Abordagem → Arquitetura → Execução → Resultado (conditional rendering)
- **Proof:** `gb-surface-card-elevated` with `CountUp` for metrics
- **CTA Band:** `gb-cta-band` with `StandardCTA` + `CommercialAuditModal`
- **Prev/Next:** `gb-surface-card` cards with `gb-link-more`

---

## CASOS DE SUCESSO (`/casos-de-sucesso`)

### Before (Legacy)
- Dark theme `bg-[#0a0603]`
- Accordion-style case cards
- `bg-[#0a0603]` backgrounds

### After (New Design System)
- **Hero:** Light premium, `gb-surface-page`, `gb-grid-overlay`
- **Stats Bar:** `METRICS.projectsDelivered.value` + hardcoded stats
- **Cases Grid:** `gb-surface-card gb-card-lift` with `Reveal`
- **Case Cards:** `gb-chip` tags, `gb-link-more` to product/pillar
- **Assessment CTA:** `operations-score` assessment
- **Final CTA:** `gb-cta-band` with `StandardCTA` + `CommercialAuditModal`

---

## SHARED PATTERNS (All 4 Pages)

### Hero Structure
```tsx
<section className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    {/* Hero content */}
  </div>
  <div className="gb-container pb-16">
    <div className="gb-hairline-accent" />
  </div>
</section>
```

### Section Rhythm
```tsx
// Alternating surfaces
<section className="gb-surface-page gb-section">      {/* White */}
<section className="gb-surface-section gb-section">  {/* Sand section */}
<section className="gb-surface-subtle gb-section">   {/* Subtle sand */}
<section className="gb-surface-page gb-section !pt-0">  {/* CTA band */}
```

### Cards
```tsx
// Standard
<div className="gb-surface-card gb-card-lift h-full">

// Elevated (proof)
<div className="gb-surface-card-elevated h-full">

// Pillar card
<div className="gb-surface-pillar-card gb-card-lift h-full" style={{ '--gb-pillar': 'var(--gb-ai-base)' }}>
```

### Motion
```tsx
// Reveal animation
<Reveal i={index}>
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
    {children}
  </motion.div>
</Reveal>
```

### CTA Band
```tsx
<section className="gb-surface-page gb-section !pt-0">
  <div className="gb-container">
    <Reveal i={0}>
      <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
        <StandardCTA asChild size="lg"><Link to="/booking">Agendar Diagnóstico <ArrowRight /></Link></StandardCTA>
        <StandardCTA asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary"><Link to="/contact">Falar com Especialista <ArrowRight /></Link></StandardCTA>
        <CommercialAuditModal ... />
      </div>
    </Reveal>
  </div>
</section>
```

---

## VERIFICATION CHECKLIST (All 4 Pages)

```
[ ] Hero uses gb-surface-page + gb-grid-overlay + gb-hairline-accent
[ ] Section rhythm: gb-section on all sections
[ ] Container: gb-container on all content
[ ] Cards: gb-surface-card + gb-card-lift
[ ] Motion: Reveal with staggered delay (i * 0.08)
[ ] CTA: StandardCTA components only
[ ] CTA band: gb-cta-band with StandardCTA
[ ] Motion respects useReducedMotion()
[ ] ScrollDepth with correct location
[ ] SEO metadata preserved
[ ] Analytics tracking preserved
[ ] i18n keys preserved
```

---

*Work/Portfolio migration complete. All 4 pages unified on new design system.*