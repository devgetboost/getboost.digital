# SEO Landing Expansion — R20.6

First satellite network: 10 high-intent landings (3 AI + 3 Automation +
2 Software + 2 Growth) on one data-driven template. NOTE: no prior
keyword-research artifact exists in the repo — selection follows the
brief's explicit prioritized slugs verbatim (de-facto opportunity set).

## Landings (slug → keyword → intent → cluster)

| Slug | Keyword alvo | Intent | Cluster |
|---|---|---|---|
| ai-agentes-imobiliario | ai agents para imobiliárias | atendimento + visitas 24/7 | AI por setor |
| ai-agentes-clinicas | ai agents para clínicas | marcações + confirmações | AI por setor |
| ai-agentes-restauracao | ai agents para restauração | reservas + picos | AI por setor |
| automacao-whatsapp | automação whatsapp empresas | vendas no chat | Automação por canal |
| integracao-crm | integração crm empresas | dados centrais | Integrações |
| integracao-erp | integração erp pme | stocks + faturação | Integrações |
| desenvolvimento-saas | desenvolvimento saas portugal | MVP → multi-tenant | Software por formato |
| software-gestao | software de gestão para pmes | operação central | Software por formato |
| growth-system | sistema de crescimento previsível | máquina de aquisição | Growth por sistema |
| geracao-leads | geração de leads b2b | pipeline previsível | Growth por sistema |

Keywords are documented targets, not ranking guarantees.

## Template (src/pages/LandingPage.tsx + src/data/landings.ts)

Hero (H1 + sub + booking/assessment CTAs + chips + flow visual) →
problem/solution → benefits → proof (pillar metrics + routable
products) → FAQ (accordion + FAQPage schema) → final CTA. Shared
BreadcrumbList + WebPage schema per landing. Zero code duplication:
new landings = one data entry (routes + sitemap derive from it).

## Internal linking V3

Landing → pillar hub (eyebrow + context) → related products (proof
cards, routable only) → insights (/blog, /resources) → booking.
Every hop resolves; CI asserts resolvability + no redirects.

## Lead magnet mapping

AI → ai-readiness · Automation → automation-audit · Software →
software-readiness · Growth → growth-score. Entries via hero + final
CTA (`source: landing:<slug>` in the assessment payload).

## Analytics / CRO / funnel

Automatic: page views (PageTracker), ScrollDepth per landing
(`landing_<slug>`), CTA clicks (`landing_<slug>`), assessment events,
product clicks. Generic R20.2/R20.3 helpers consume them with zero
changes (top pages/journeys, scroll zones, pillar rollups).

## Quality gates (CI)

Unique titles/descriptions/H1s · canonical bare-PT · FAQPage +
BreadcrumbList + WebPage schema · conversion + assessment presence ·
resolvability · frozen systems only. R20.5 guards extended implicitly:
sitemap emits all 10 with market alternates; llms.txt must append new
landings (follow-up).
