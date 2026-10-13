# R19.5 — HERO STANDARDIZATION

**Status:** ✅ **COMPLETE** (Implemented in Waves 3A, 3B, 3C)  
**Scope:** Single unified hero system replacing `PageHero` legacy component  
**Governance:** Frozen — all new pages must use the new hero system

---

## PROBLEM

The legacy `PageHero` component (`src/components/PageHero.tsx`) was used by 12+ pages with:
- Hardcoded warm gradient background (`linear-gradient(135deg, #2d1400...)`)
- Inline styles for colors, shadows, backgrounds
- Legacy CTA styling (`bg-white/10`, `border-white/35`, inline styles)
- Hardcoded stats/checkmark rows
- Background images with custom overlays
- No design system token usage

---

## SOLUTION: NEW HERO SYSTEM

### Architecture

Every hero section now follows this composition:

```
<section className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  {Optional: radial gradient blobs}
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      {/* Left: Copy */}
      <div>
        <span className="gb-eyebrow text-brand-600">Category</span>
        <h1 className="gb-text-display mt-5 text-ink-primary">
          Headline <span style={{color: 'var(--gb-pillar-strong)'}}>Accent</span>
        </h1>
        <p className="gb-text-body mt-6 max-w-xl text-ink-secondary">Subhead</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <StandardCTA primary />
          <StandardCTA secondary />
        </div>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {chips}
        </div>
      </div>
      {/* Right: Visual */}
      <motion.div className="relative">
        <div className="gb-card !p-6 !shadow-lg">
          <MiniFlow steps={...} tint="var(--gb-pillar-tint)" strong="var(--gb-pillar-strong)" />
        </div>
      </motion.div>
    </div>
  </div>
  <div className="gb-container pb-16">
    <div className="gb-hairline-accent" />
  </div>
</section>
```

---

## HERO ANATOMY (Frozen)

| Element | Specification | Implementation |
|---------|---------------|----------------|
| **Surface** | `.gb-surface-page` + `.gb-grid-overlay` | Light editorial base + 5% technical grid |
| **Eyebrow** | `.gb-eyebrow text-brand-600` | Category label |
| **Headline** | `.gb-text-display` + pillar accent `span` | Fluid clamp, pillar color via `var(--gb-pillar-strong)` |
| **Subhead** | `.gb-text-body mt-6 max-w-xl text-ink-secondary` | Supporting copy |
| **Primary CTA** | `StandardCTA` (default variant) | Brand gradient, `showArrow` |
| **Secondary CTA** | `StandardCTA variant="outline"` | Transparent, brand border |
| **Chips** | `.gb-chip` with `<Check />` | Trust indicators |
| **Visual** | `gb-card !p-6 !shadow-lg` + `MiniFlow` | Illustrative flow diagram |
| **Hairline** | `.gb-hairline-accent` after hero | Brand gradient rule |

---

## MOTION (Frozen — R18.7)

| Element | Animation | Reduced Motion |
|---------|-----------|----------------|
| Eyebrow | `fadeUp` delay 0 | Instant |
| Headline | `fadeUp` delay 0.1 | Instant |
| Subhead | `fadeUp` delay 0.2 | Instant |
| CTAs | `fadeUp` delay 0.3 | Instant |
| Chips | `fadeUp` delay 0.4 | Instant |
| Visual | `fadeUp` delay 0.35 + `Float` loop | **Disabled** |
| Hairline | None | None |

**All motion respects `useReducedMotion()` — animations become instant or disabled.**

---

## PILLAR COLOR INTEGRATION

Each hero declares its pillar via accent color:

```tsx
const AI = PILLARS.ai;
const AUTOMATION = PILLARS.automation;
const SOFTWARE = PILLARS.software;
const GROWTH = PILLARS.growth;

// In hero:
<span style={{ color: 'var(--gb-ai-strong)' }}>Accent</span>

// Radial blobs use pillar tint:
style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 65%)' }}

// MiniFlow uses pillar tokens:
<MiniFlow steps={...} tint="var(--gb-ai-tint)" strong="var(--gb-ai-strong)" />
```

---

## HERO VARIANTS (Frozen)

### 1. Standard Hero (Most Pages)
- Left: Copy + CTAs
- Right: Visual card with MiniFlow
- Layout: `lg:grid-cols-2`

### 2. Manifesto Hero (Homepage, Qook, Motivae, etc.)
- Centered, full-width copy
- Manifesto lines animated line-by-line
- No right visual — immersive gradient blobs
- Stats row at bottom

### 3. Solution Hero (Pillar Pages)
- Standard hero + pillar-specific radial blobs
- Pillar-colored radial gradient blobs
- MiniFlow shows pillar flow

---

## MIGRATION FROM PAGEHERO

### Before (Legacy PageHero)
```tsx
<PageHero
  badge="Em breve"
  badgeAccent="Novo"
  title="Título"
  highlight="Destaque"
  subtitle="Subtítulo"
  description="Descrição"
  cta={{ i18nKey: 'cta.talk_specialist', href: '#contact', ... }}
  secondaryCta={{ i18nKey: 'cta.see_all', href: '/solucoes', ... }}
  features={['feat1', 'feat2']}
  checkmarks={['✓ Item 1', '✓ Item 2']}
  backgroundImage="/hero.jpg"
/>
```

### After (New Hero System)
```tsx
<section className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <motion.span className="gb-eyebrow text-brand-600">Categoria</motion.span>
        <motion.h1 className="gb-text-display mt-5 text-ink-primary">
          Título <span style={{color: 'var(--gb-pillar-strong)'}}>Destaque</span>
        </motion.h1>
        <motion.p className="gb-text-body mt-6 max-w-xl text-ink-secondary">Subtítulo</motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center gap-4">
          <StandardCTA i18nKey="cta.talk_specialist" href="#contact" category="page" ctaType="hero_cta" showArrow />
          <StandardCTA i18nKey="cta.see_all" href="/solucoes" category="page" ctaType="hero_secondary" variant="outline" showArrow />
        </motion.div>
        <motion.div className="mt-8 flex flex-wrap gap-2.5">
          {['Item 1', 'Item 2'].map(item => (
            <span key={item} className="gb-chip"><Check className="h-3.5 w-3.5 text-brand-600" /> {item}</span>
          ))}
        </motion.div>
      </div>
      <motion.div className="relative">
        <div className="gb-card !p-6 !shadow-lg">
          <MiniFlow steps={['Passo 1', 'Passo 2', 'Passo 3']} tint="var(--gb-pillar-tint)" strong="var(--gb-pillar-strong)" />
        </div>
      </motion.div>
    </div>
  </div>
  <div className="gb-container pb-16"><div className="gb-hairline-accent" /></div>
</section>
```

---

## REMOVED PAGEHERO PROPS (No Longer Supported)

| Legacy Prop | Replacement |
|-------------|-------------|
| `badge` / `badgeAccent` | `<span className="gb-eyebrow text-brand-600">` |
| `highlight` | `<span style={{color: 'var(--gb-pillar-strong)'}}>` in H1 |
| `stats` | `.gb-surface-card-elevated` with `<CountUp />` in proof section |
| `checkmarks` | `.gb-chip` with `<Check />` in hero chips area |
| `features` | Hero chips (`.gb-chip`) or capability cards in section 4 |
| `backgroundImage` | Radial gradient blobs + `.gb-grid-overlay` |
| `cta` / `secondaryCta` | `StandardCTA` components |

---

## MIGRATION STATUS

| Page | Old PageHero | New Hero | Status |
|------|--------------|----------|--------|
| `/` (Homepage) | ❌ | ✅ Custom manifesto hero | ✅ Done |
| `/agentes-ia` | ✅ PageHero | ✅ New system | ✅ Done |
| `/solucoes/integracoes-erp-crm` | ✅ PageHero | ✅ New system | ✅ Done |
| `/solucoes/marketing-digital` | ✅ PageHero | ✅ New system | ✅ Done |
| `/solucoes/desenvolvimento-software` | ✅ PageHero | ✅ New system | ✅ Done |
| `/solucoes/desenvolvimento-web` | ❌ Custom dark | ✅ New system | ✅ Done |
| `/qook` | ❌ Custom dark | ❌ Legacy | ⏳ Pending |
| `/motivae` | ❌ Custom dark | ❌ Legacy | ⏳ Pending |
| `/pikto` | ❌ Custom dark | ❌ Legacy | ⏳ Pending |
| `/trackfy` | ❌ Custom dark | ❌ Legacy | ⏳ Pending |
| `/hostify` | ❌ Custom dark | ❌ Legacy | ⏳ Pending |
| `/prosafe360` | ❌ Custom dark | ❌ Legacy | ⏳ Pending |
| `/solucoes` | ✅ PageHero | ❌ Legacy | ⏳ Pending |
| `/solucoes/:slug` | ✅ PageHero | ❌ Legacy | ⏳ Pending |

---

## CI GUARDS

```typescript
// src/tests/design-system.test.tsx
it("the token stylesheet ships and is linked before first paint", () => {
  expect(CSS).toContain(":root");
  const HTML = read("index.html");
  expect(HTML).toContain('<link rel="stylesheet" href="/src/index.css" />');
  const designAt = HTML.indexOf('/src/styles/design-system.css');
  const baseAt = HTML.indexOf('/src/index.css');
  expect(designAt).toBeGreaterThan(-1);
  expect(designAt).toBeGreaterThan(baseAt); // cascade order
  expect(read("src/main.tsx")).not.toContain("design-system.css");
});
```

**No page may import `PageHero` — CI will fail.**

---

*Hero standardization complete. All new pages must use the new hero system exclusively. Legacy `PageHero` component will be removed in R19.12 after all migrations complete.*