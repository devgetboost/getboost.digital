# R19.6 — SOLUTIONS MIGRATION

**Status:** 🔄 **IN PROGRESS** — 18/20 pages migrated, 2 remaining  
**Scope:** Migrate ALL `/solucoes/*` pages to new design system  
**Governance:** Frozen design system tokens — no new visual patterns

---

## SOLUTIONS INVENTORY

### CANONICAL SOLUTION SLUGS (20 total — CI guarded)

| Slug | Page Component | Visual Generation | Status | Priority |
|------|----------------|-------------------|--------|----------|
| `/solucoes` | Services.tsx | **OLD** | ⏳ **PENDING** | **HIGH** |
| `/agentes-ia` | AgentesIA.tsx | NEW | ✅ Done | — |
| `/solucoes/bots-whatsapp-ia` | BotsWhatsApp.tsx | NEW | ✅ Done | — |
| `/solucoes/gestao-redes-sociais` | GestaoRedesSociais.tsx | NEW | ✅ Done | — |
| `/solucoes/branding-identidade` | BrandingIdentidade.tsx | NEW | ✅ Done | — |
| `/solucoes/paid-media` | PaidMedia.tsx | NEW | ✅ Done | — |
| `/solucoes/seo-geo-webmcp` | SeoGeoWebmcp.tsx | NEW | ✅ Done | — |
| `/solucoes/copywriting-conteudo` | CopywritingConteudo.tsx | NEW | ✅ Done | — |
| `/solucoes/video-fotografia` | VideoFotografia.tsx | NEW | ✅ Done | — |
| `/solucoes/email-marketing` | EmailMarketing.tsx | NEW | ✅ Done | — |
| `/solucoes/mvp-30-dias` | Mvp30Dias.tsx | NEW | ✅ Done | — |
| `/solucoes/landing-pages` | LandingPages.tsx | NEW | ✅ Done | — |
| `/solucoes/desenvolvimento-web` | DesenvolvimentoWeb.tsx | **OLD** | ⏳ **PENDING** | **HIGH** |
| `/solucoes/desenvolvimento-mobile` | DesenvolvimentoMobile.tsx | HYBRID | ⏳ **PENDING** | **MEDIUM** |
| `/solucoes/desenvolvimento-software` | DesenvolvimentoSaaS.tsx | NEW | ✅ Done | — |
| `/solucoes/ux-ui-design` | UxUiDesign.tsx | NEW | ✅ Done | — |
| `/solucoes/sistemas-gestao-pmes` | SistemasGestaoPmes.tsx | NEW | ✅ Done | — |
| `/solucoes/integracoes-erp-crm` | IntegracoesErpCrm.tsx | NEW | ✅ Done | — |
| `/solucoes/funis-vendas` | FunisVendas.tsx | NEW | ✅ Done | — |
| `/solucoes/marketing-digital` | MarketingDigital.tsx | NEW | ✅ Done | — |
| `/solucoes/desenvolvimento-saas` | DesenvolvimentoSaaS.tsx | NEW | ✅ Done | — |

---

## MIGRATION TARGET: Services.tsx (HIGH PRIORITY)

### Current State (Legacy)
- Uses `PageHero` with background image
- Old card styles: `bg-white dark:bg-card`, `border border-border/40`, `hover:shadow-xl`
- Legacy tabs: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` with old styling
- Hardcoded spacing: `section-padding`, `max-w-7xl mx-auto`, `px-6 md:px-12`
- Old product cards with `aspect-[16/10]`, `object-cover`, inline styles
- Legacy SAAS products hardcoded (not from catalog)

### Target State (New Design System)
- **Hero:** New hero system with `gb-surface-page`, `gb-grid-overlay`, `gb-hairline-accent`
- **Areas Section:** `gb-surface-page` + `gb-section` + `gb-container` + `SectionHeader` + card grid with `.gb-surface-card` + `.gb-card-lift`
- **Tabs:** Keep `Tabs` but style with design system tokens
- **Product Cards:** `.gb-surface-card` + `.gb-card-lift` + `gb-link-more`
- **SAAS Products:** Use `PRODUCTS` catalog filter (not hardcoded)
- **Spacing:** `gb-section` + `gb-container` only

---

## MIGRATION PLAN PER PAGE

### 1. Services.tsx (HIGH — 8h)
```tsx
// REMOVE
import PageHero from '@/components/PageHero';
import heroAnalytics from '@/assets/hero-analytics.jpg';
import { useProducts } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import { servicesData } from '@/data/services';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// REPLACE WITH
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { StandardCTA } from '@/components/StandardCTA';
import { PRODUCTS } from '@/data/products';
import { analytics } from '@/lib/analytics';
import { MiniFlow } from '@/components/ui/mini-flow';

// HERO
<section className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <span className="gb-eyebrow text-brand-600">Soluções</span>
        <h1 className="gb-text-display mt-5 text-ink-primary">
          Três áreas, um <span className="text-brand-600">parceiro digital</span>
        </h1>
        <p className="gb-text-body mt-6 max-w-xl text-ink-secondary">
          Marketing, Engenharia de Software e IA aplicada — combinados para escalar o teu negócio.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <StandardCTA i18nKey="servicesPage.heroCta" href="/booking" category="services" ctaType="hero_cta" showArrow />
          <StandardCTA i18nKey="servicesPage.heroSecondaryCta" href="/portfolio" category="services" ctaType="hero_secondary" variant="outline" showArrow />
        </div>
      </div>
      {/* Visual: 3-area MiniFlow */}
    </div>
  </div>
  <div className="gb-container pb-16"><div className="gb-hairline-accent" /></div>
</section>

// AREAS SECTION
<section className="gb-surface-page gb-section">
  <div className="gb-container">
    <SectionHeader
      eyebrow="Áreas de Atuação"
      title="Três áreas, um <span className="text-brand-600">parceiro digital</span>"
      description="Marketing, Engenharia de Software e IA aplicada — combinados para escalar o teu negócio."
    />
    <div className="mt-12 grid gap-6 md:grid-cols-3">
      {serviceGroups.map((group, i) => (
        <Reveal key={group.title} i={i}>
          <div className="gb-surface-card gb-card-lift h-full">
            <span className="gb-icon-chip" style={{ '--gb-chip-bg': `var(--gb-${group.pillar}-tint)`, '--gb-chip-fg': `var(--gb-${group.pillar}-strong)` }}>
              <group.icon className="h-5 w-5" />
            </span>
            <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{group.title}</h3>
            <ul className="mt-4 flex flex-col gap-2">
              {group.items.map(item => (
                <Link key={item.slug} to={item.to} className="group block rounded-xl border border-black/[0.06] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-primary">
                    <Check className="h-4 w-4 text-brand-600" />
                    {item.title}
                  </span>
                </Link>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

### 2. DesenvolvimentoWeb.tsx (HIGH — 8h)
**Current:** Full dark theme `bg-[#0a0603]`, inline gradients, old CTA buttons
**Target:** New hero system with Software pillar colors (`--gb-software-*`)

```tsx
// REPLACE entire HERO section
<section ref={heroRef} className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
    style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(255,255,255,0) 65%)' }} />
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <motion.span className="gb-eyebrow text-brand-600">Web Engineering · Performance · SEO · Conversão</motion.span>
        <motion.h1 className="gb-text-display mt-5 text-ink-primary">
          Transformamos ideias em plataformas que crescem <span style={{ color: 'var(--gb-software-strong)' }}>durante anos</span>.
        </motion.h1>
        <motion.p className="gb-text-body mt-6 max-w-xl text-ink-secondary">
          Construímos software, aplicações web, plataformas SaaS e sistemas digitais preparados para escalar operações, equipas e clientes.
        </motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center gap-4">
          <StandardCTA i18nKey="cta.talk_specialist" href="/booking" category="software" ctaType="hero_cta" showArrow />
          <StandardCTA i18nKey="cta.see_all" href="#prova" category="software" ctaType="hero_secondary" variant="outline" showArrow />
        </motion.div>
        <motion.div className="mt-8 flex flex-wrap gap-2.5">
          {['SaaS', 'Web Apps', 'Mobile Apps', 'Escalabilidade', 'Arquitetura'].map(item => (
            <span key={item} className="gb-chip"><Check className="h-3.5 w-3.5 text-brand-600" /> {item}</span>
          ))}
        </motion.div>
      </div>
      {/* Visual: Software pillar MiniFlow */}
    </div>
  </div>
  <div className="gb-container pb-16"><div className="gb-hairline-accent" /></div>
</section>
```

### 3. Product Landings (6 pages — HIGH — 5h each)
**Pattern:** All 6 use identical legacy dark theme structure
**Migration:** Replace with new hero system + pillar-appropriate colors

| Product | Pillar | Accent Color |
|---------|--------|--------------|
| Qook | Automation | `--gb-automation-*` |
| Motivae | AI | `--gb-ai-*` |
| Pikto | Software | `--gb-software-*` |
| Trackfy | Automation | `--gb-automation-*` |
| Hostify | AI | `--gb-ai-*` |
| ProSafe360 | AI | `--gb-ai-*` |

**Template:**
```tsx
// REPLACE HERO
<section className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
    style={{ background: 'radial-gradient(circle, rgba(PILLAR_BASE,0.10) 0%, transparent 65%)' }} />
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <motion.span className="gb-eyebrow text-brand-600">Categoria</motion.span>
        <motion.h1 className="gb-text-display mt-5 text-ink-primary">
          Título <span style={{ color: 'var(--gb-pillar-strong)' }}>Destaque</span>
        </motion.h1>
        <motion.p className="gb-text-body mt-6 max-w-xl text-ink-secondary">Subtítulo</motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center gap-4">
          <StandardCTA i18nKey="cta.demo" href="/demo?produto=X" category="product" ctaType="hero_cta" showArrow />
          <StandardCTA i18nKey="cta.contact" href="#contact" category="product" ctaType="hero_secondary" variant="outline" showArrow />
        </motion.div>
        <motion.div className="mt-8 flex flex-wrap gap-2.5">
          {['Feature 1', 'Feature 2', 'Feature 3'].map(item => (
            <span key={item} className="gb-chip"><Check className="h-3.5 w-3.5 text-brand-600" /> {item}</span>
          ))}
        </motion.div>
      </div>
      {/* Visual: Product MiniFlow */}
    </div>
  </div>
  <div className="gb-container pb-16"><div className="gb-hairline-accent" /></div>
</section>
```

### 4. DesenvolvimentoMobile.tsx (MEDIUM — 4h)
**Current:** HYBRID — partially migrated
**Action:** Complete migration to new hero system + Mobile pillar colors

### 5. SolucaoPlaceholder.tsx (MEDIUM — 3h)
**Current:** Uses `PageHero`
**Action:** Replace with new hero system, keep placeholder content

---

## MIGRATION CHECKLIST (Per Page)

```
[ ] Replace PageHero with new hero system
[ ] Add gb-grid-overlay to hero
[ ] Add gb-hairline-accent after hero
[ ] Replace inline gradients with pillar radial blobs
[ ] Replace inline colors with design tokens (var(--gb-pillar-*))
[ ] Replace old CTA buttons with StandardCTA / Button
[ ] Replace old card styles with .gb-surface-card / .gb-card-lift
[ ] Replace old chips with .gb-chip
[ ] Replace old icon chips with .gb-icon-chip (--gb-chip-bg / --gb-chip-fg)
[ ] Replace py-24 md:py-32 with gb-section
[ ] Replace max-w-7xl mx-auto px-6 md:px-12 with gb-container
[ ] Replace old card styles with .gb-surface-card / .gb-card-lift
[ ] Replace old chips with .gb-chip
[ ] Replace old icon chips with .gb-icon-chip
[ ] Replace old timeline with MiniFlow
[ ] Replace old CTA buttons with StandardCTA / Button
[ ] Add gb-grid-overlay to hero sections
[ ] Add gb-hairline-accent after hero
[ ] Add ScrollDepth component with correct location
[ ] Verify reduced motion support
[ ] Verify SEO metadata preserved
[ ] Verify analytics tracking preserved
[ ] Verify i18n keys preserved
```

---

## VALIDATION CRITERIA

### Automated (CI)
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] No `PageHero` imports in production pages
- [ ] No hardcoded `py-24`, `py-32` in new pages
- [ ] No hardcoded `max-w-7xl mx-auto px-6` in new pages

### Manual QA (Per Page)
- [ ] Visual match to Figma reference
- [ ] Dark/light theme consistency
- [ ] Reduced motion respected
- [ ] Focus states visible
- [ ] Mobile responsive (320px, 768px, 1024px, 1440px)
- [ ] Motion respects `prefers-reduced-motion`
- [ ] CTA hover/tap states work
- [ ] ScrollDepth fires correctly
- [ ] Analytics tracking fires correctly
- [ ] i18n keys resolve correctly (pt, en, es)
- [ ] SEO metadata renders correctly
- [ ] JSON-LD schema valid

---

## ROLLBACK PLAN

If migration introduces regression:
1. `git revert` the migration commit
2. `npm run build` to verify stability
3. Document issue in migration log
4. Re-attempt with fix

---

*Migration in progress. Priority: Services.tsx → DesenvolvimentoWeb.tsx → 6 Product Landings → DesenvolvimentoMobile.tsx → SolucaoPlaceholder.tsx*