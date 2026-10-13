# R19.13 — VISUAL QA

**Status:** PENDING (After all migrations complete)

## VISUAL QA CHECKLIST (Per Page)

### Hero Section
- [ ] gb-surface-page + gb-grid-overlay present
- [ ] gb-hairline-accent after hero
- [ ] Radial blob uses pillar base color (rgba(BASE, 0.10))
- [ ] Headline: gb-text-display + pillar accent span
- [ ] Subhead: gb-text-body + text-ink-secondary
- [ ] Primary CTA: StandardCTA default + showArrow
- [ ] Secondary CTA: StandardCTA outline + showArrow
- [ ] Chips: gb-chip with Check icon
- [ ] Visual card: gb-card !p-6 !shadow-lg + MiniFlow
- [ ] MiniFlow uses pillar tint/strong tokens

### Sections
- [ ] All sections use .gb-section
- [ ] Alternating surfaces: gb-surface-page, gb-surface-section, gb-surface-subtle
- [ ] Container: gb-container on all content
- [ ] Cards: gb-surface-card + gb-card-lift
- [ ] Elevated cards: gb-surface-card-elevated
- [ ] Pillar cards: gb-surface-pillar-card with --gb-pillar

### Motion
- [ ] Reveal with fadeUp variants
- [ ] Stagger: i * 0.08 delay
- [ ] Float loop on hero visual (disabled on reduced motion)
- [ ] Card Lift on hover (translateY(-6px) scale(1.02))
- [ ] Link underline draws from left (180ms)
- [ ] Float loop disabled on prefers-reduced-motion
- [ ] Parallax disabled on reduced motion
- [ ] CTA drift disabled on reduced motion

### CTAs
- [ ] All CTAs use StandardCTA or Button
- [ ] Primary: StandardCTA default + showArrow
- [ ] Secondary: StandardCTA outline + showArrow
- [ ] Ghost: Button variant="ghost"
- [ ] Link: Button variant="link"
- [ ] gb-cta-band on final CTA section
- [ ] CommercialAuditModal integrated

### Typography
- [ ] Display: gb-text-display
- [ ] H1: gb-text-h1
- [ ] H2: gb-text-h2
- [ ] H3: gb-text-h3
- [ ] Body: gb-text-body
- [ ] Small: gb-text-small
- [ ] Eyebrow: gb-eyebrow (mono, uppercase, 0.22em tracking)

### Colors
- [ ] No hardcoded hex colors (except design system tokens)
- [ ] Pillar colors via var(--gb-pillar-*) only
- [ ] Brand orange only via --gb-brand-500
- [ ] No turquoise/teal outside Automation pillar
- [ ] No legacy green outside Growth pillar
- [ ] No blue accents outside Software pillar

### Responsive
- [ ] 320px (mobile)
- [ ] 375px (mobile)
- [ ] 768px (tablet)
- [ ] 1024px (desktop)
- [ ] 1440px (desktop)
- [ ] No horizontal overflow

### Motion & Accessibility
- [ ] prefers-reduced-motion respected (all motion instant/disabled)
- [ ] Focus states visible (ring-2, ring-offset-2)
- [ ] Touch targets >= 44x44px
- [ ] Color contrast AA (text), AAA (large text)

### SEO & Meta
- [ ] Unique <title> per page
- [ ] Unique <meta name="description">
- [ ] Canonical URL correct
- [ ] jsonLd schema valid (WebPage, BreadcrumbList, FAQPage, Article, Product)
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] hreflang tags for pt/en/es

### Analytics
- [ ] ScrollDepth with correct location
- [ ] analytics.trackClick on all CTAs
- [ ] analytics.trackProduct on product links
- [ ] analytics.trackAssessment on assessment CTAs
- [ ] No console errors

### i18n
- [ ] pt-BR (default)
- [ ] en-US
- [ ] es-ES
- [ ] Market switcher works (PT/BR/INTL)
- [ ] No hardcoded Portuguese strings

### Performance
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] No layout shift on load
- [ ] Images lazy-loaded
- [ ] Fonts preloaded

---

## QA TOOLS

```bash
# Visual regression (Chromatic/Percy)
npm run test:visual

# Lighthouse CI
npx lighthouse-ci autorun

# Accessibility
npx axe-cli https://staging.getboost.digital

# Bundle analysis
npm run build && npx vite-bundle-analyzer
```

---

## SIGN-OFF TABLE

| Page | QA Engineer | Date | Status |
|---|---|---|---|
| Homepage | | | |
| /agentes-ia | | | |
| /solucoes/integracoes-erp-crm | | | |
| /solucoes/marketing-digital | | | |
| /solucoes/desenvolvimento-software | | | |
| /solucoes/desenvolvimento-web | | | |
| /solucoes | | | |
| /qook | | | |
| /motivae | | | |
| /pikto | | | |
| /trackfy | | | |
| /hostify | | | |
| /prosafe360 | | | |
| /work | | | |
| /portfolio | | | |
| /portfolio/:id | | | |
| /casos-de-sucesso | | | |
| /insights | | | |
| /blog | | | |
| /blog/:id | | | |
| /resources | | | |
| /resources/:id | | | |
| /podcast | | | |
| /webinars | | | |
| /academy | | | |
| /academy/:slug | | | |
| /dashboard | | | |
| /booking | | | |
| /contact | | | |