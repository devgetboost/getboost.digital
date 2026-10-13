# R19.7 — PRODUCTS MIGRATION

**Status:** 🔄 **IN PROGRESS** — 0/6 product landings migrated  
**Scope:** Migrate 6 product landing pages to new design system  
**Governance:** Frozen design system tokens — pillar-appropriate colors only

---

## PRODUCT INVENTORY

| Product | Route | Pillar | Current State | Target State | Effort |
|---------|-------|--------|---------------|--------------|--------|
| **Qook** | `/qook` | Automation | Legacy dark theme | New hero + Automation colors | 5h |
| **Motivae** | `/motivae` | AI | Legacy dark theme | New hero + AI colors | 5h |
| **Pikto** | `/pikto` | Software | Legacy dark theme | New hero + Software colors | 5h |
| **Trackfy** | `/trackfy` | Automation | Legacy dark theme | New hero + Automation colors | 5h |
| **Hostify** | `/hostify` | AI | Legacy dark theme | New hero + AI colors | 5h |
| **ProSafe360** | `/prosafe360` | AI | Legacy dark theme | New hero + AI colors | 5h |

---

## CURRENT STATE ANALYSIS

### Common Legacy Patterns (All 6 Pages)

```tsx
// HERO — Full dark theme
<section className="relative overflow-hidden bg-[#0a0603] text-white">
  <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(...)' }} />
  <div aria-hidden className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55)...' }} />
  <motion.div aria-hidden initial={{ y: '-100%' }} animate={{ y: '120%' }} ... className="bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent" />
  <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40">
    // Manifest lines with animated spans
    <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.75rem,8vw,7rem)]">
      {manifestoLines.map((line, i) => (
        <motion.span key={line} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }} className="block">
          {i === manifestoLines.length - 1 ? <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>{line}</span> : line}
        </motion.span>
      ))}
    </h1>
    // Line animation
    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-10 h-px w-40 origin-left" style={{ background: `${ACCENT}b3` }} />
    // CTA buttons with inline styles
    <Link to="/demo?produto=X" className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white" style={{ borderColor: ACCENT, color: '#ffb494' }} onMouseEnter={...} onMouseLeave={...} >
    // Stats grid with inline styles
    <motion.div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8">
```

### Key Legacy Patterns to Replace

| Pattern | Current | Replacement |
|---------|---------|-------------|
| `bg-[#0a0603]` | `gb-surface-page` + pillar radial blobs |
| `max-w-7xl mx-auto px-6 md:px-12` | `gb-container` |
| `py-28 md:py-40` | `gb-section !pt-10 md:!pt-16` + `pb-16` |
| Inline gradient blobs | Pillar-specific radial blobs via `style` |
| `bg-[#ff4000]` inline | `gb-gradient-brand` or `StandardCTA` |
| `border-2` CTA buttons | `StandardCTA` component |
| `border-white/10` stats border | `gb-hairline-accent` |
| `grid-cols-2 md:grid-cols-4` stats | `gb-surface-card-elevated` + `CountUp` |
| `manifestoLines` animated spans | `gb-text-display` + pillar accent span |

---

## MIGRATION TEMPLATE (Per Product)

### 1. Hero Section

```tsx
// BEFORE
<section className="relative overflow-hidden bg-[#0a0603] text-white">
  <div aria-hidden className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(...)' }} />
  <div aria-hidden className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55)...' }} />
  <motion.div aria-hidden initial={{ y: '-100%' }} animate={{ y: '120%' }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent" />
  <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40">
    // ... manifesto, CTAs, stats

// AFTER
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
      <motion.div style={{ y: reduceMotion ? 0 : clusterY }} className="relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <motion.div animate={reduceMotion ? undefined : { y: [0, -8, 0] }} transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="gb-card !p-6 !shadow-lg">
              <div className="flex items-center justify-between">
                <span className="gb-eyebrow text-ink-tertiary">Operação em tempo real</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  Live
                </span>
              </div>
              <MiniFlow steps={['Passo 1', 'Passo 2', 'Passo 3']} tint="var(--gb-pillar-tint)" strong="var(--gb-pillar-strong)" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  </div>
  <div className="gb-container pb-16"><div className="gb-hairline-accent" /></div>
</section>
```

### 2. Features Section

```tsx
// BEFORE: features array with manifestoLines, ACCENT colors
// AFTER: Standard feature cards with gb-surface-card + gb-card-lift

<section className="gb-surface-section gb-section">
  <div className="gb-container">
    <SectionHeader eyebrow="Capacidades" title="O que o produto faz" description="..." />
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feat, i) => (
        <Reveal key={feat.title} i={i % 3}>
          <div className="gb-card gb-card-lift h-full !p-6">
            <span className="gb-icon-chip" style={{ '--gb-chip-bg': 'var(--gb-pillar-tint)', '--gb-chip-fg': 'var(--gb-pillar-strong)' }}>
              <feat.icon className="h-5 w-5" />
            </span>
            <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{feat.title}</h3>
            <p className="gb-text-small mt-2 text-ink-secondary">{feat.desc}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

### 3. Proof Section

```tsx
// BEFORE: stats with ACCENT colors
// AFTER: gb-surface-card-elevated with CountUp

<section className="gb-surface-page gb-section">
  <div className="gb-container">
    <SectionHeader eyebrow="Prova" title="Resultados" description="..." />
    <div className="mt-12 grid gap-6 md:grid-cols-3">
      {PROOF.map((p, i) => (
        <Reveal key={p.k} i={i}>
          <div className="gb-surface-card-elevated h-full">
            <div className="gb-text-display" style={{ color: 'var(--gb-pillar-strong)' }}><CountUp value={p.k} /></div>
            <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
            <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

### 4. Final CTA

```tsx
// BEFORE: gb-cta-band with ACCENT inline styles
// AFTER: Standard gb-cta-band with StandardCTA

<section className="gb-surface-page gb-section !pt-0">
  <div className="gb-container">
    <Reveal i={0}>
      <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
        <div className="relative">
          <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(PILLAR_BASE,0.25) 0%, rgba(0,0,0,0) 65%)' }} animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }} transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="relative">
            <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
              Pronto para <span style={{ color: '#ff4000' }}>transformar</span> o teu negócio?
            </h2>
            <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">Descrição...</p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <StandardCTA asChild size="lg"><Link to="/booking" onClick={() => analytics.trackClick('product_cta', 'booking', 'consideration')}><span>Agendar Diagnóstico</span><ArrowRight className="h-4 w-4" /></Link></StandardCTA>
              <StandardCTA asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary"><Link to="/contact" onClick={() => analytics.trackClick('product_cta', 'contact', 'consideration')}><span>Falar com Especialista</span><ArrowRight className="h-4 w-4" /></Link></StandardCTA>
            </div>
            <button type="button" onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"><Zap className="h-4 w-4" /> ou faz a auditoria grátis de 7 min</button>
          </div>
        </div>
      </Reveal>
    </div>
  </div>
</section>
```

---

## PILLAR COLOR MAPPING

| Product | Pillar | Base | Strong | Tint | Border | Glow |
|---------|--------|------|--------|------|--------|------|
| **Qook** | Automation | `#0d9488` | `#0f766e` | `#f0fdfa` | `#ccfbf1` | `rgb(13 148 136 / 0.32)` |
| **Trackfy** | Automation | `#0d9488` | `#0f766e` | `#f0fdfa` | `#ccfbf1` | `rgb(13 148 136 / 0.32)` |
| **Motivae** | AI | `#7c3aed` | `#6d28d9` | `#f5f3ff` | `#ddd6fe` | `rgb(124 58 237 / 0.32)` |
| **Hostify** | AI | `#7c3aed` | `#6d28d9` | `#f5f3ff` | `#ddd6fe` | `rgb(124 58 237 / 0.32)` |
| **ProSafe360** | AI | `#7c3aed` | `#6d28d9` | `#f5f3ff` | `#ddd6fe` | `rgb(124 58 237 / 0.32)` |
| **Pikto** | Software | `#2563eb` | `#1d4ed8` | `#eff6ff` | `#dbeafe` | `rgb(37 99 235 / 0.32)` |
| **Trackfy** | Automation | `#0d9488` | `#0f766e` | `#f0fdfa` | `#ccfbf1` | `rgb(13 148 136 / 0.32)` |

**Usage in Hero Radial Blob:**
```tsx
style={{ background: 'radial-gradient(circle, rgba(PILLAR_BASE,0.10) 0%, transparent 65%)' }}
```

**Usage in CTA Band Glow:**
```tsx
style={{ background: 'radial-gradient(ellipse, rgba(PILLAR_BASE,0.25) 0%, rgba(0,0,0,0) 65%)' }}
```

**Usage in MiniFlow:**
```tsx
<MiniFlow steps={...} tint="var(--gb-pillar-tint)" strong="var(--gb-pillar-strong)" />
```

---

## MIGRATION ORDER & EFFORT

| Priority | Product | Effort | Dependencies |
|----------|---------|--------|--------------|
| 1 | Qook | 5h | Automation pillar |
| 2 | Motivae | 5h | AI pillar |
| 3 | Pikto | 5h | Software pillar |
| 4 | Trackfy | 5h | Automation pillar |
| 5 | Hostify | 5h | AI pillar |
| 6 | ProSafe360 | 5h | AI pillar |

**Total: 30 hours**

---

## VALIDATION CHECKLIST (Per Product)

```
[ ] Hero uses gb-surface-page + gb-grid-overlay + gb-hairline-accent
[ ] Radial blob uses pillar base color (rgba(BASE, 0.10))
[ ] Headline uses gb-text-display + pillar strong accent span
[ ] Subhead uses gb-text-body text-ink-secondary
[ ] Primary CTA: StandardCTA default variant + showArrow
[ ] Secondary CTA: StandardCTA outline variant + showArrow
[ ] Chips use gb-chip with Check icon
[ ] Visual card uses gb-card !p-6 !shadow-lg + MiniFlow
[ ] MiniFlow uses pillar tint/strong tokens
[ ] Features section uses gb-surface-card + gb-card-lift
[ ] Feature cards use gb-icon-chip with pillar tint/strong
[ ] Proof section uses gb-surface-card-elevated + CountUp
[ ] Proof numbers use pillar strong color
[ ] CTA band uses gb-cta-band with pillar radial glow
[ ] StandardCTA components for all CTAs
[ ] ScrollDepth location set correctly
[ ] Reduced motion respected
[ ] i18n keys preserved
[ ] Analytics tracking preserved
[ ] SEO metadata preserved
```

---

*Migration in progress. All 6 products follow identical template with pillar-specific tokens.*