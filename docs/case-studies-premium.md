# Case Studies Premium — R20.7

Turns the portfolio from an informative gallery into a commercial proof
asset. No client, metric, testimonial or number was invented: every
narrative, tag and result below is content already shipped by the site or
served by the CMS.

## 1. Official framework (src/data/case-framework.ts)

Contexto → Desafio → Diagnóstico → Solução → Implementação → Resultado →
Próximos Passos. `CASE_FRAMEWORK` declares the seven stages together with
the Clean V1 `CaseStudyView` fields that feed each one. Sections render
only when their field carries data (`presentText` / `renderableResults`), so
a sparse case never shows an empty stage.

## 2. Case template (src/pages/PortfolioDetail.tsx)

Hero (title, client, year, booking + contextual assessment + contact) →
Resumo executivo (Cliente/Setor/Ano) → Desafio → Abordagem → Arquitetura
(capabilities + technologies + MiniFlow execution flow) → Execução →
Resultado → CTA + prev/next case.

Removed in the premium pass: the embla carousel and its autoplay plugin —
scroll narrative replaced the horizontal gallery (R18.9 storytelling).

## 3. Asset inventory (Fase 3)

| Asset | Material | Treatment |
|---|---|---|
| Qook, Motivae, Pikto, Trackfy | full narrative (challenge, tags, outcome) | case card + product page |
| Hostify (`/hostify`) | narrative shipped on `/casos-de-sucesso` | case card, live route kept (R19.8 exception) |
| ProSafe360 (`/prosafe360`) | narrative shipped on `/casos-de-sucesso` | case card, live route kept (R19.8 exception) |
| Alojify, Safely | catalog entries only (no narrative) | represented in the portfolio product spotlight, not as cases |
| Guia Cities, Descobre Quem Tu És | institutional platforms, no narrative | institutional representation only |

CMS case studies (`case_studies` + localizations) drive `/portfolio/:id`;
the empty state is preserved by design (no static fallback invented).

## 4. Product stories

The hub links each narrative to its product route (derived from the
narrative destination, never hardcoded twice) and to the pillars that own
that product, using `productPillars()` — a reverse map computed from the
pillar dataset, not a new source of truth.

## 5. Authority layer V2

Case → pillar (from execution evidence) → product (exact catalog-name
match on the client) → cases hub → portfolio. `productForClient()` returns
null unless the client name matches a catalog product exactly, so a proof
link is never guessed.

## 6. SEO (Fase 9–10)

Per case: `<title>` and description from the CMS `seoTitle` /
`seoDescription` when authored, otherwise the visible title/summary;
canonical `/portfolio/<slug>`; `WebPage` + `BreadcrumbList` + `Article`
(organization author, `datePublished` from the publish year). The cases
hub carries `WebPage` + `BreadcrumbList`. Schema comes from real CMS
fields only.

## 7. Lead magnets (Fase 11)

`assessmentForCase()` maps the case's own capabilities + technologies onto
the R20.4 engines: AI → `ai-readiness`, Automation → `automation-audit`,
Software → `software-readiness`, Growth → `growth-score`, and the neutral
`operations-score` when there is no pillar evidence. Matching is
deterministic (fixed pillar order; short tokens like "ia"/"ai" only match
whole words so "fotografia" never reads as AI). This is a heuristic for
relevance, documented as such — it never invents an engine.

## 8. Conversion layer (Fase 12)

Case detail: primary Agendar Diagnóstico, secondary contextual assessment,
tertiary Falar com Especialista, plus the 7-min commercial audit in the
closing band. Hub: booking + portfolio + contextual `operations-score`
assessment + audit.

## 9. Analytics + case intelligence (Fase 13–14)

Tracked per case: page views (path), scroll depth (`case_<slug>` location),
CTA clicks (stamped with `{ case: slug }`), assessments
(`source: case:<slug>`), product interactions. `src/lib/case-intelligence.ts`
is a pure layer (no DOM/storage/network) answering: top interest, top
leads, best scroll, most meetings, best CTR. Attribution order: `data.case`
→ `data.source` → `data.journey` → `path`; CTR only above 100 views. Wired
into the existing debug funnel report (`__gbFunnelReport`).

Limitations (inherited from R20.2): event-proxy counts, never person
counts; cross-page conversion attribution relies on the recorded journey.

## 10. Case hub evolution (Fase 16)

`/portfolio` gains a proof-hub band with three lanes — Casos
(`#casos` + `/casos-de-sucesso`), Produtos (`#produtos` + `/produtos`) and
Implementações (`#implementacoes`, the execution model). The R19.3 SEO
block is untouched.

## Gaps carried forward

- CMS case URLs are dynamic, so they are not in the static sitemap; only
  the hubs are. Indexation of `/portfolio/:slug` depends on the CMS feed.
- `/hostify` and `/prosafe360` landing copy still carries the legacy brand
  names (brand-owner task, unchanged in R20.7).
