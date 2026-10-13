# R19 — MIGRATION PLAN

**Program:** GETBOOST 2027 — Design Consolidation (R19)
**Status:** IN PROGRESS
**Target:** 100% visual consistency across all 63 public routes
**Reference:** Homepage (Index.tsx) — GETBOOST_2027_DESIGN_FREEZE_V1

---

## PHASE OVERVIEW

| Phase | Name | Status | Dependencies |
|-------|------|--------|--------------|
| R19.1 | Design Audit | Done | — |
| R19.2 | Legacy Inventory | Done | R19.1 |
| R19.3 | Design System Freeze | Done | Wave 3A |
| R19.4 | Global Layout Consolidation | Done | Waves 3A, 3B, 3E |
| R19.5 | Hero Standardization | Done | R19.3, R19.4 |
| R19.6 | Solutions Migration | In Progress | R19.5 |
| R19.7 | Products Migration | Pending | R19.5 |
| R19.8 | Work/Portfolio Migration | Done | R19.5 |
| R19.9 | Insights/Blog Migration | Done | R19.5 |
| R19.10 | Footer V2 | Done | R19.4 |
| R19.11 | Motion System | Done | R18.7, R19.3 |
| R19.12 | Legacy Removal | Pending | All migrations |
| R19.13 | Visual QA | Pending | All migrations |

## CURRENT SPRINT: R19.6 + R19.7

### Priority 1: Services.tsx (8h)
- Replace PageHero with new hero system
- Migrate 3-area cards to design system
- Migrate tabs to design system
- Migrate product cards to catalog-driven

### Priority 2: DesenvolvimentoWeb.tsx (8h)
- Full dark theme to new hero system
- Software pillar colors
- Feature cards to design system

### Priority 3: 6 Product Landings (5h each)
| Product | Pillar | Effort |
|---------|--------|--------|
| Qook | Automation | 5h |
| Motivae | AI | 5h |
| Pikto | Software | 5h |
| Trackfy | Automation | 5h |
| Hostify | AI | 5h |
| ProSafe360 | AI | 5h |

### Priority 4: Remaining (4h + 3h)
- DesenvolvimentoMobile.tsx (4h)
- SolucaoPlaceholder.tsx (3h)

## MIGRATION TEMPLATE (Per Page)
```
[ ] Page: [route]
[ ] Replace PageHero with new hero system
[ ] Replace inline gradients with pillar radial blobs
[ ] Replace inline colors with design tokens
[ ] Replace old CTA buttons with StandardCTA / Button
[ ] Replace old card styles with .gb-surface-card / .gb-card-lift
[ ] Replace old chips with .gb-chip
[ ] Replace old icon chips with .gb-icon-chip
[ ] Replace py-24 md:py-32 with gb-section
[ ] Replace max-w-7xl mx-auto px-6 md:px-12 with gb-container
[ ] Replace old card styles with .gb-surface-card / .gb-card-lift
[ ] Replace old chips with .gb-chip
[ ] Replace old icon chips with .gb-icon-chip
[ ] Replace old timeline with MiniFlow
[ ] Replace old CTA buttons with StandardCTA / Button
[ ] Add gb-grid-overlay to hero sections
[ ] Add gb-hairline-accent after hero
[ ] Add ScrollDepth component
[ ] Verify reduced motion support
[ ] Verify SEO metadata preserved
[ ] Verify analytics tracking preserved
[ ] Verify i18n keys preserved
```

## VALIDATION GATES (Per Page)
### Automated (CI)
- npm run test passes
- npm run build succeeds
- npx tsc --noEmit -> 0 errors
- No PageHero imports in production pages
- No hardcoded py-24, py-32 in new pages
- No hardcoded max-w-7xl mx-auto px-6 in new pages

### Manual QA (Per Page)
- Visual match to Figma reference
- Dark/light theme consistency
- Reduced motion respected
- Focus states visible
- Mobile responsive (320px, 768px, 1024px, 1440px)
- Motion respects prefers-reduced-motion
- CTA hover/tap states work
- ScrollDepth fires correctly
- Analytics tracking fires correctly
- i18n keys resolve correctly (pt, en, es)
- SEO metadata renders correctly
- JSON-LD schema valid

## TIMELINE
| Week | Focus | Deliverable |
|---|---|---|
| 1 | Services.tsx + DesenvolvimentoWeb.tsx | 2 pages migrated |
| 2 | Qook + Motivae + Pikto | 3 products migrated |
| 3 | Trackfy + Hostify + ProSafe360 | 3 products migrated |
| 4 | DesenvolvimentoMobile + SolucaoPlaceholder | 2 pages migrated |
| 5 | Legacy Removal + Visual QA | Clean repo + QA sign-off |

## DEFINITION OF DONE (Per Wave)
- All pages in wave migrated
- All tests pass (71 files, 883+ tests)
- Build succeeds (npm run build)
- TypeScript clean (tsc --noEmit)
- Visual QA checklist 100% (per page)
- No PageHero imports remain
- No hardcoded py-24, py-32, max-w-7xl
- No hardcoded hex colors (except tokens)
- Design system test passes
- Release-readiness test passes