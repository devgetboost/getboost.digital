# SEO Foundation 2.0 — R20.5

Complete metadata audit + remediation. Every route page now carries an
SEO block (or documented noindex), every page renders exactly one h1
(or a documented exclusive branch), the OG image exists, llms.txt is
canonical, and sitemap/robots are verified.

## Audit findings (all fixed)

| # | Finding | Fix |
|---|---|---|
| 1 | `og-image.jpg` missing since Wave 2A.3 — every OG/Twitter tag 404'd | Generated `public/og-image.jpg` 1200×630 (brand dark + orange, 98KB). Existing `/og-image.jpg` URLs now resolve; no tag changes needed |
| 2 | ResetPassword, Unsubscribe had no SEO block | `<SEO noIndex>` (auth/tokenized utilities must never index) |
| 3 | ROICalculator (public tool) had no SEO block | Full title/description/canonical (`/tools/roi-calculator`) |
| 4 | Services hub had zero h1 | Promoted the section heading to h1 (classes unchanged) |
| 5 | llms.txt stale: `/about`, `/services/*`, 3 retired slugs, legacy product names, old positioning | Rewritten: canonical routes, official 6+2 catalog, current positioning + registry numbers |
| 6 | Sitemap still emitted `/about/*` alternates | Regenerated after R19.9 removal (verified: zero `/about` URLs) |

## Accepted patterns (guard-allowlisted with reason)

- **Exclusive error-state h1s** (AcademyCourseDetail, DemoRequest,
  DigitalAuditResults, ResetPassword): error tree early-returns, so
  exactly one h1 reaches the DOM. Any NEW multi-h1 file fails CI until
  justified here.
- **SoftwareDevHero branch** (ServiceDetail): conditional hero, one branch.
- **Delegated h1**: SolucaoPlaceholder + SolucoesSlugRouter render it via
  PageHero / resolved child (verified: PageHero owns a single h1).

## Coverage matrix

| Surface | Title | Desc | Canonical | H1 | JSON-LD | OG |
|---|---|---|---|---|---|---|
| Homepage + hubs + pillars + products | ✓ | ✓ | ✓ | 1 | Org/ItemList where applicable | ✓ (new file) |
| Tools (roi/seo/ideas/audit/branding/guide) | ✓ | ✓ | ✓ | 1 | — | ✓ default |
| Legal + auth utilities | noindex | — | — | 1 | — | — |
| Sitemap (7 files) | getboost.digital only, no redirects/retired | | | | | |
| robots.txt | private areas disallowed, canonical sitemaps | | | | | |

## R20.6 inputs (landing expansion prerequisites — ready)

- OG asset pipeline: PIL script pattern documented above; per-pillar OG
  images can follow the same 1200×630 template.
- JSON-LD gaps: BreadcrumbList absent on pillar/hub pages; FAQPage
  absent on Booking/Contact; Product schema absent on landings.
- Hreflang/canonical machinery verified — new landings inherit it via
  the SEO component + sitemap generator (add slugs to `staticRoutes`).
- llms.txt is now the canonical LLM surface — new landings must append
  entries here (guard enforces canonical-only links).
