# R19.3 — DESIGN SYSTEM FREEZE

**Status:** ✅ **COMPLETE** (Implemented in Wave 3A, R18.8)  
**Reference:** `src/styles/design-system.css` + `tailwind.config.ts`  
**Governance:** Frozen — changes require CI approval via `design-system.test.ts`  
**Source of Truth:** Homepage (Index.tsx) — GETBOOST_2027_DESIGN_FREEZE_V1

---

## FROZEN TOKEN LAYER

All tokens are defined as CSS custom properties in `src/styles/design-system.css` and mirrored into Tailwind via `tailwind.config.ts`. **Additive only** — no token may be removed or renamed without CI gate approval.

---

### COLOR PALETTE (Frozen)

#### Brand (The Only Accent)
```css
--gb-brand-50:  #fff2ed;
--gb-brand-100: #ffe0d4;
--gb-brand-200: #ffc2a9;
--gb-brand-300: #ff9c78;
--gb-brand-400: #ff7647;
--gb-brand-500: #ff4000;  /* THE BRAND CONSTANT — chrome, CTA, focus */
--gb-brand-600: #db3800;  /* Orange TEXT on light (AA) */
--gb-brand-700: #b72f00;  /* Pressed / active */
```

#### Warm Neutral (Sand) — Editorial Backgrounds
```css
--gb-sand-0:   #ffffff;
--gb-sand-50:  #fafaf9;
--gb-sand-100: #f5f5f4;
--gb-sand-200: #e7e5e4;
--gb-sand-300: #d6d3d1;
--gb-sand-400: #a8a29e;
--gb-sand-500: #78716c;
--gb-sand-600: #57534e;
--gb-sand-700: #44403c;
--gb-sand-800: #292524;
--gb-sand-900: #1c1917;
--gb-sand-950: #0c0a09;
```

#### Background Scale (Canvas)
```css
--gb-canvas-base:      #ffffff;      /* Page base */
--gb-canvas-subtle:    #fafaf9;      /* Subtle sections */
--gb-canvas-section:   #f5f5f4;      /* Section backgrounds */
--gb-canvas-tint:      #fff2ed;      /* Orange wash — MAX ONE per page */
--gb-canvas-inverse:   #0c0a09;      /* CTA bands + footer ONLY */
```

#### Text Scale (Ink)
```css
--gb-ink-primary:   #1c1917;   /* Primary text */
--gb-ink-secondary: #57534e;   /* Secondary text */
--gb-ink-tertiary:  #a8a29e;   /* Captions/meta ONLY */
--gb-ink-inverse:   #fafaf9;   /* On dark surfaces */
--gb-ink-on-brand:  #ffffff;   /* On brand orange */
```

#### Status Colors (Semantic Only)
```css
--gb-success:       #15803d;
--gb-success-bg:    #f0fdf4;
--gb-success-border:#bbf7d0;
--gb-warning:       #b45309;
--gb-warning-bg:    #fffbeb;
--gb-warning-border:#fde68a;
--gb-error:         #b91c1c;
--gb-error-bg:      #fef2f2;
--gb-error-border:  #fecaca;
```

---

### PILLAR COLORS (One Hue Per Pillar — Orange NEVER a Pillar Color)

```css
/* AI — Purple */
--gb-ai-base:      #7c3aed;
--gb-ai-strong:    #6d28d9;
--gb-ai-tint:      #f5f3ff;
--gb-ai-border:    #ddd6fe;
--gb-ai-glow:      rgb(124 58 237 / 0.32);

/* Automation — Teal */
--gb-automation-base:      #0d9488;
--gb-automation-strong:    #0f766e;
--gb-automation-tint:      #f0fdfa;
--gb-automation-border:    #ccfbf1;
--gb-automation-glow:      rgb(13 148 136 / 0.32);

/* Software — Blue */
--gb-software-base:      #2563eb;
--gb-software-strong:    #1d4ed8;
--gb-software-tint:      #eff6ff;
--gb-software-border:    #dbeafe;
--gb-software-glow:      rgb(37 99 235 / 0.32);

/* Growth — Green */
--gb-growth-base:      #16a34a;
--gb-growth-strong:    #15803d;
--gb-growth-tint:      #f0fdf4;
--gb-growth-border:    #dcfce7;
--gb-growth-glow:      rgb(22 163 74 / 0.32);
```

---

### SPACING (8pt Base Grid)

```css
--gb-space-1:  0.25rem;  /* 4  */
--gb-space-2:  0.5rem;   /* 8  */
--gb-space-3:  0.75rem;  /* 12 */
--gb-space-4:  1rem;     /* 16 */
--gb-space-6:  1.5rem;   /* 24 */
--gb-space-8:  2rem;     /* 32 */
--gb-space-10: 2.5rem;   /* 40 */
--gb-space-12: 3rem;     /* 48 */
--gb-space-16: 4rem;     /* 64 */
--gb-space-20: 5rem;     /* 80 */
--gb-space-24: 6rem;     /* 96 */
--gb-space-32: 8rem;     /* 128 */
```

---

### RADII & SHADOWS (Single Scale)

```css
--gb-radius-card:  1rem;      /* Rounded-2xl — de-facto card radius */
--gb-radius-inner: 0.75rem;   /* Inner elements */

--gb-shadow-rest:  0 1px 2px rgb(28 25 23 / 0.05);
--gb-shadow-hover: 0 8px 24px rgb(28 25 23 / 0.08);

/* Single shadow scale — entire platform */
--gb-shadow-sm:   0 1px 2px rgb(16 24 40 / 0.05);
--gb-shadow-md:   0 8px 24px -8px rgb(16 24 40 / 0.12);
--gb-shadow-lg:   0 20px 50px -20px rgb(16 24 40 / 0.18);
--gb-shadow-premium: 0 24px 60px -24px rgb(16 24 40 / 0.25);

/* Single hairline for light surfaces */
--gb-line: rgb(17 24 39 / 0.08);

/* Brand gradient — ONLY gradient language for CTAs */
--gb-gradient-brand: linear-gradient(135deg, #ff4000 0%, #cc3300 100%);
```

---

### TYPOGRAPHY (Frozen Scale)

| Token | Desktop | Mobile | Line Height | Weight | Tracking |
|-------|---------|--------|-------------|--------|----------|
| `gb-text-display` | clamp(2.5rem, 1.6rem+3.6vw, 3.5rem) | — | 1.06 | 900 | -0.025em |
| `gb-text-h1` | clamp(2rem, 1.4rem+2.4vw, 2.75rem) | — | 1.18 | 800 | -0.02em |
| `gb-text-h2` | clamp(1.625rem, 1.2rem+1.6vw, 2rem) | — | 1.2 | 700 | -0.02em |
| `gb-text-h3` | clamp(1.25rem, 1.05rem+0.8vw, 1.5rem) | — | 1.33 | 700 | -0.01em |
| `gb-text-body` | 1rem | 1rem | 1.625 | 400 | — |
| `gb-text-small` | 0.875rem | 0.875rem | 1.57 | 400 | — |
| `gb-eyebrow` | 0.6875rem (11px) | 0.6875rem | 1.45 | 500 | 0.22em (uppercase, mono) |

---

### SURFACE UTILITIES (Frozen Classes)

| Class | Purpose |
|-------|---------|
| `.gb-surface-page` | Page base — white, `gb-grid-overlay` |
| `.gb-surface-section` | Section — `gb-canvas-section` |
| `.gb-surface-subtle` | Subtle — `gb-canvas-subtle` |
| `.gb-surface-card` | Standard card — hairline + rest shadow |
| `.gb-surface-card-elevated` | Hover lift — deeper shadow |
| `.gb-surface-pillar-card` | 4px top accent via `--gb-pillar` |
| `.gb-cta-band` | Near-black inverse, orange accent only |
| `.gb-card` | Base card DNA — never restate |
| `.gb-card-lift` | Premium hover: `translateY(-6px) scale(1.02)` + glow |
| `.gb-chip` | Trust chips, feature tags, status pills |
| `.gb-icon-chip` | Card glyphs — tint via `--gb-chip-bg`/`--gb-chip-fg` |
| `.gb-link-more` | Micro-interaction: underline draws from left |
| `.gb-flow-connector` | Mini diagrams — marching ants animation |
| `.gb-grid-overlay` | 5% opacity technical grid |
| `.gb-hairline` / `.gb-hairline-accent` | Structural rules |

---

### MOTION (R18.7 — Frozen)

| Pattern | Implementation |
|---------|----------------|
| Entrance | `fadeUp` variants — `opacity 0 → 1`, `y 30 → 0`, `duration 0.6`, `ease [0.16,1,0.3,1]` |
| Reveal | `whileInView` once, staggered via `custom` index |
| Float | `y: [0, -8, 0]`, `duration 5-6s`, `repeat: Infinity`, `easeInOut` — **disabled on reduced motion** |
| Card Lift | `translateY(-6px) scale(1.02)` + `box-shadow` + pillar glow via `--gb-glow` |
| Link Underline | ScaleX `0 → 1`, `origin: left`, `180ms` |
| Flow Connector | Marching ants — vertical mobile, horizontal desktop |
| Parallax | Subtle `y` transform via `useScroll`/`useTransform` — **disabled on reduced motion** |
| CTA Drift | Slow ellipse `x: [-50%, -46%, -50%]`, `14s`, `repeat: Infinity` |

**Reduced Motion:** All motion respects `useReducedMotion()` — animations become instant or disabled.

---

### CI GUARDS (Enforcement)

```typescript
// src/tests/design-system.test.ts — fails CI on:
// - Token removal or value drift
// - Missing scales/classes/variants
// - Broken SectionHeader export
// - Frozen colour token existence + exact hex values
// - SectionHeader export integrity
```

**To modify any frozen token:**
1. Update `src/styles/design-system.css`
2. Mirror in `tailwind.config.ts` if new Tailwind mapping needed
3. Run `npm run test` — CI will fail if token contract broken
4. Update this document if token added (additive only)

---

### FORBIDDEN (Never Introduce)

| Category | Forbidden | Reason |
|----------|-----------|--------|
| Colors | Turquoise/Teal (`#14b8a6`, `#0d9488` as primary) | Only Automation pillar |
| Colors | Legacy Green (`#10b981`, `#059669`) | Only Growth pillar |
| Colors | Blue accents (`#3b82f6`, `#2563eb`) | Only Software pillar |
| Colors | Orange as pillar color | Orange = Brand ONLY |
| Gradients | Legacy SaaS gradients | Only `--gb-gradient-brand` |
| Layout | Custom spacing scales | Use 8pt grid tokens |
| Typography | Custom type scales | Frozen scale only |
| Shadows | Custom shadow values | Single scale only |
| Motion | New animation categories | Frozen set only |

---

### GOVERNANCE

| Action | Required |
|--------|----------|
| Add new token | PR + CI pass + update this doc |
| Modify token value | **Not allowed** — create new token instead |
| Remove token | **Not allowed** — deprecate in doc, keep in code |
| New motion category | **Not allowed** — frozen set |
| New surface class | Allowed if composes frozen tokens only |

---

*Design System frozen at GETBOOST_2027_DESIGN_FREEZE_V1 (Wave 3A). All migrations (R19.4+) must compose exclusively from this frozen layer.*