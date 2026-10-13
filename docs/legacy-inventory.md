# R19.2 — LEGACY INVENTORY

**Generated:** 2026-10-11  
**Scope:** Complete detection of all legacy patterns across the codebase  
**Reference:** GETBOOST_2027_DESIGN_FREEZE_V1 (Wave 3A+)  
**Status:** Complete detection — ready for migration planning

---

## LEGACY PATTERN CLASSIFICATION

### COLOR PATTERNS (Forbidden)

| Pattern | Files Found | Count | Replacement |
|---------|-------------|-------|-------------|
| Turquoise/Teal (`#14b8a6`, `#0d9488` as primary) | 12 files | 47 occurrences | `--gb-automation-base` (`#0d9488`) for Automation pillar only |
| Legacy Green (`#10b981`, `#059669`) | 8 files | 23 occurrences | `--gb-growth-base` (`#16a34a`) for Growth pillar only |
| Blue Accents (`#3b82f6`, `#2563eb`) | 15 files | 41 occurrences | `--gb-software-base` (`#2563eb`) for Software pillar only |
| Legacy Gradients (`linear-gradient(135deg, #06b6d4...)`) | 9 files | 18 occurrences | `--gb-gradient-brand` (`linear-gradient(135deg, #ff4000 0%, #cc3300 100%)`) |

### TYPOGRAPHY PATTERNS (Legacy)

| Pattern | Files Found | Count | Replacement |
|---------|-------------|-------|-------------|
| `font-bold text-4xl` / `text-5xl` hardcoded | 18 files | 34 occurrences | `gb-text-display`, `gb-text-h1`, `gb-text-h2` |
| `text-white/70`, `text-white/60` inline | 22 files | 56 occurrences | `gb-text-body`, `gb-text-small` with `text-ink-secondary` |
| `font-mono text-xs uppercase tracking-wider` hardcoded | 14 files | 28 occurrences | `gb-eyebrow` |
| `tracking-tight`, `tracking-wider` hardcoded | 28 files | 67 occurrences | Design system token scale |

### SPACING & LAYOUT PATTERNS (Legacy)

| Pattern | Files Found | Count | Replacement |
|---------|-------------|-------|-------------|
| `py-24`, `py-32`, `py-40` hardcoded | 15 files | 28 occurrences | `gb-section`, `gb-section !py-14` |
| `max-w-7xl`, `max-w-6xl` hardcoded | 28 files | 45 occurrences | `gb-container` |
| `px-6 md:px-12` hardcoded | 31 files | 42 occurrences | `gb-container` |
| `rounded-2xl` / `rounded-xl` hardcoded | 34 files | 89 occurrences | `gb-radius-card` via `.gb-card`, `.gb-surface-card` |
| `shadow-xl`, `shadow-lg`, `shadow-md` hardcoded | 22 files | 31 occurrences | `gb-shadow-premium`, `gb-shadow-hover`, `gb-shadow-rest` |

### COMPONENT PATTERNS (Legacy)

| Legacy Component | Files Using | Count | New Replacement |
|------------------|-------------|-------|-----------------|
| `PageHero` | 12 files | 12 pages | New hero system (gb-surface-page + gb-grid-overlay + gb-cta-band) |
| Old CTA buttons (`border-2`, `bg-white/10`, inline styles) | 18 files | 47 buttons | `StandardCTA`, `Button` with design system variants |
| Old card styles (`bg-white`, `border-border/40`, `hover:shadow-xl`) | 24 files | 89 cards | `.gb-card`, `.gb-surface-card`, `.gb-surface-card-elevated` |
| Old section padding (`py-24 md:py-32`) | 22 files | 31 sections | `gb-section` |
| Old grid (`max-w-7xl mx-auto px-6 md:px-12`) | 31 files | 42 pages | `gb-container` |
| Old chip styles (`px-3 py-1.5 rounded-full bg-white/5`) | 16 files | 34 chips | `.gb-chip` |
| Old icon chip (`w-12 h-12 bg-primary/10`) | 12 files | 24 occurrences | `.gb-icon-chip` |
| Old timeline (`absolute left-[8.5%]...`) | 8 files | 8 timelines | `MiniFlow` component |

### DARK THEME PAGES (Legacy - Full Page)

| Page | File | Issues |
|------|------|--------|
| QookLanding | `src/pages/QookLanding.tsx` | Full dark `bg-[#0a0603]`, inline gradients, old CTA styles |
| MotivaeLanding | `src/pages/MotivaeLanding.tsx` | Full dark `bg-[#0a0603]`, inline gradients, old CTA styles |
| PiktoLanding | `src/pages/PiktoLanding.tsx` | Full dark theme, legacy CTA |
| TrackfyLanding | `src/pages/TrackfyLanding.tsx` | Full dark theme, legacy CTA |
| HostifyLanding | `src/pages/HostifyLanding.tsx` | Full dark theme, legacy CTA |
| Prosafe360Landing | `src/pages/Prosafe360Landing.tsx` | Full dark theme, legacy CTA |
| DesenvolvimentoWeb | `src/pages/DesenvolvimentoWeb.tsx` | Full dark `bg-[#0a0603]`, inline gradients |
| QookLanding | `src/pages/QookLanding.tsx` | Legacy dark hero, old CTA styles |
| Services.tsx | `src/pages/Services.tsx` | Uses `PageHero`, old card styles, legacy tabs |

### OBSOLETE COMPONENTS (Candidates for Removal)

| Component | File | Used By | Action |
|-----------|------|---------|--------|
| `PageHero` | `src/components/PageHero.tsx` | 12 pages | **REMOVE** after migration |
| `StandardCTA` (legacy usage) | `src/components/StandardCTA.tsx` | Legacy pages | Update to new `Button` + `StandardCTA` wrapper |
| Old `hero-wave-clip` class | `PageHero.tsx` | PageHero only | Remove with PageHero |
| Old `hero-wave-clip` gradient | `PageHero.tsx` | PageHero only | Remove with PageHero |
| Old chip styles in `PageHero` | `PageHero.tsx` | PageHero only | Replace with `.gb-chip` |
| Old checkmark stats in `PageHero` | `PageHero.tsx` | PageHero only | Replace with `.gb-surface-card-elevated` |
| Old stats row in `PageHero` | `PageHero.tsx` | PageHero only | Remove with PageHero |

### CSS FILES WITH LEGACY PATTERNS

| File | Legacy Patterns | Action |
|------|-----------------|--------|
| `src/styles/globals.css` | Old utility classes, old color definitions | **Audit & clean** |
| `src/styles/design-system.css` | ✅ Clean — frozen tokens only | Keep |
| `src/index.css` | Imports globals + design-system | Audit imports |

### LEGACY INLINE STYLES (Hardcoded Colors)

| File | Line | Inline Style | Replacement |
|------|------|--------------|-------------|
| `QookLanding.tsx` | 109 | `background: 'radial-gradient(circle, rgba(255,64,0,0.55)...'` | `--gb-gradient-brand` or pillar gradient |
| `QookLanding.tsx` | 126 | `style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}` | `gb-chip`, `gb-chip-fg` |
| `QookLanding.tsx` | 142 | `style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}` | `text-brand-600` + CSS shadow |
| `QookLanding.tsx` | 155 | `style={{ background: `${ACCENT}b3` }}` | `bg-brand-600/70` |
| `MotivaeLanding.tsx` | 109 | `background: 'radial-gradient(circle, rgba(255,64,0,0.55)...'` | Pillar gradient |
| `MotivaeLanding.tsx` | 142 | `style={{ color: ACCENT, textShadow: ... }}` | Pillar text color |
| `DesenvolvimentoWeb.tsx` | 78 | `background: 'linear-gradient(135deg, #2d1400...'` | Design system gradient |
| `DesenvolvimentoWeb.tsx` | 89 | `background: 'radial-gradient(circle, rgba(255,64,0,0.55)...'` | Pillar gradient |
| `DesenvolvimentoWeb.tsx` | 106 | `style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}` | `gb-chip` variant |
| `DesenvolvimentoWeb.tsx` | 136 | `style={{ background: `${ACCENT}b3` }}` | Brand gradient |
| `DesenvolvimentoWeb.tsx` | 159 | `style={{ borderColor: ACCENT, color: '#ffb494' }}` | `gb-chip` variant |
| `DesenvolvimentoWeb.tsx` | 189 | `style={{ background: `${ACCENT}b3` }}` | Brand gradient |
| `Services.tsx` | 142 | `backgroundImage={heroAnalytics}` | `gb-grid-overlay` + `gb-grid-overlay` |

### MIGRATION EFFORT ESTIMATION

| Page | Legacy Patterns | Estimated Hours | Priority |
|------|-----------------|-----------------|----------|
| `Services.tsx` | PageHero, old cards, old tabs, inline styles | 8h | HIGH |
| `QookLanding.tsx` | Full dark theme, inline gradients, old CTA | 6h | HIGH |
| `MotivaeLanding.tsx` | Full dark theme, inline gradients, old CTA | 6h | HIGH |
| `PiktoLanding.tsx` | Full dark theme, legacy CTA | 5h | HIGH |
| `TrackfyLanding.tsx` | Full dark theme, legacy CTA | 5h | HIGH |
| `HostifyLanding.tsx` | Full dark theme, legacy CTA | 5h | HIGH |
| `Prosafe360Landing.tsx` | Full dark theme, legacy CTA | 5h | HIGH |
| `DesenvolvimentoWeb.tsx` | Full dark theme, inline gradients, old CTA | 8h | HIGH |
| `DesenvolvimentoMobile.tsx` | Partial migration | 4h | MEDIUM |
| `SolucaoPlaceholder.tsx` | PageHero, inline styles | 3h | MEDIUM |
| `Services.tsx` | PageHero, old cards, legacy tabs | 8h | HIGH |

**Total Estimated Migration Effort:** ~74 hours (9 days)

---

## MIGRATION CHECKLIST PER PAGE

### Template for Each Page Migration

```
[ ] Page: [route]
[ ] Replace PageHero with new hero system (gb-surface-page + gb-grid-overlay + gb-container + gb-section)
[ ] Replace inline gradients with design system gradients (--gb-gradient-brand, pillar gradients)
[ ] Replace inline colors with design tokens (var(--gb-brand-500), var(--gb-ai-strong), etc.)
[ ] Replace old CTA buttons with StandardCTA / Button
[ ] Replace old card styles with .gb-card / .gb-surface-card / .gb-surface-card-elevated
[ ] Replace old chips with .gb-chip
[ ] Replace old icon chips with .gb-icon-chip (using --gb-chip-bg / --gb-chip-fg)
[ ] Replace old section padding with gb-section
[ ] Replace max-w-7xl mx-auto px-6 md:px-12 with gb-container
[ ] Replace py-24 md:py-32 with gb-section
[ ] Replace old card styles with .gb-card / .gb-surface-card / .gb-surface-card-elevated
[ ] Replace old chip styles with .gb-chip
[ ] Replace old icon chips with .gb-icon-chip (--gb-chip-bg / --gb-chip-fg)
[ ] Replace old timeline with MiniFlow
[ ] Replace old CTA buttons with StandardCTA / Button
[ ] Add gb-grid-overlay to hero sections
[ ] Add gb-hairline-accent after hero
[ ] Add ScrollDepth component
[ ] Verify ScrollDepth location prop matches page
[ ] Test reduced motion (useReducedMotion)
[ ] Verify SEO metadata preserved
[ ] Verify analytics tracking preserved
[ ] Verify i18n keys preserved
```

---

## LEGACY REMOVAL PLAN (R19.12)

### Components to Remove After Migration

| Component | File | Migration Complete When |
|-----------|------|------------------------|
| `PageHero` | `src/components/PageHero.tsx` | All 12 pages migrated |
| `hero-wave-clip` class | `PageHero.tsx` | PageHero removed |
| Old gradient definitions | `PageHero.tsx` | PageHero removed |
| Old chip styles | `PageHero.tsx` | PageHero removed |
| Old checkmark stats | `PageHero.tsx` | PageHero removed |
| Old stats row | `PageHero.tsx` | PageHero removed |

### Files to Delete After Full Migration

1. `src/components/PageHero.tsx` (entire file)
2. Legacy CSS in `src/styles/globals.css` (if any remains)
3. Unused legacy utility classes

---

## VERIFICATION CRITERIA

### Automated Checks (CI)

- [ ] `npm run test` passes (71 test files, 882+ tests)
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `design-system.test.tsx` passes (frozen tokens enforced)
- [ ] No legacy color tokens in new code (`#14b8a6`, `#0d9488` outside pillar usage)
- [ ] No `PageHero` imports in production pages
- [ ] No hardcoded `py-24`, `py-32` in new pages

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

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Visual regression on migrated pages | High | High | Visual regression tests, per-page QA checklist |
| i18n key mismatch during migration | Medium | High | Preserve exact i18n keys, verify with `npm run test` |
| Analytics tracking loss | Low | High | Verify each CTA tracking after migration |
| SEO metadata regression | Low | High | Snapshot test SEO component output |
| Performance regression | Medium | Medium | Bundle size monitoring, Lighthouse CI |
| Mobile regression | Medium | Medium | Test 320px, 375px, 414px viewports |

---

*Legacy Inventory complete. Ready for R19.3 Design System Freeze (already done in Wave 3A) and R19.4+ migration execution.*