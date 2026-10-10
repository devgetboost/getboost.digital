# Redirect & Route Inventory — Wave 2A.6

Single source of truth for every soft redirect in the SPA router. The guard
`src/tests/route-integrity.test.ts` fails CI if this document and
`src/App.tsx` drift apart. Each entry renders for both the bare path and its
`/:lang` market twin (e.g. `/solucoes/seo` and `/en/solucoes/seo`).

Mechanism: client-side `<Navigate>` (soft redirect — executes only after the
SPA loads; guaranteed to execute since Wave 2A.1's host rewrite serves the
shell for unknown paths). **Future host-level 301 candidates** below list the
paths that should become server-side 301s once the host supports rewrite
rules, so link equity passes without a JS round-trip.

## 1. Legacy `/solucoes/*` → canonical replacements (SAFE_TO_KEEP)

| Legacy route | Destination | Classification | Note |
|---|---|---|---|
| `/solucoes/seo-blog` | `/solucoes/seo-geo-webmcp` | SAFE_TO_KEEP | retired slug, live link equity possible |
| `/solucoes/seo` | `/solucoes/seo-geo-webmcp` | SAFE_TO_KEEP | short legacy URL |
| `/solucoes/google-meta-ads` | `/solucoes/paid-media` | SAFE_TO_KEEP | renamed service |
| `/solucoes/publicidade-meta-google` | `/solucoes/paid-media` | SAFE_TO_KEEP | old dual-name URL |
| `/solucoes/publicidade` | `/solucoes/paid-media` | SAFE_TO_KEEP | short legacy URL |
| `/solucoes/branding-identidade-visual` | `/solucoes/branding-identidade` | SAFE_TO_KEEP | long legacy slug |
| `/solucoes/branding` | `/solucoes/branding-identidade` | SAFE_TO_KEEP | short legacy URL |
| `/solucoes/auditoria-marketing` | `/solucoes` | SAFE_TO_KEEP | retired page → hub |
| `/solucoes/copywriting` | `/solucoes/copywriting-conteudo` | SAFE_TO_KEEP | short legacy URL |
| `/solucoes/redes-sociais` | `/solucoes/gestao-redes-sociais` | SAFE_TO_KEEP | short legacy URL |
| `/solucoes/fotografia-drone` | `/solucoes/video-fotografia` | SAFE_TO_KEEP | renamed service |
| `/solucoes/hostify` | `/hostify` | SAFE_TO_KEEP | product moved above `/solucoes` |
| `/solucoes/qook` | `/qook` | SAFE_TO_KEEP | product moved above `/solucoes` |
| `/seguranca-trabalho` | `/prosafe360` | SAFE_TO_KEEP | product renamed |

## 2. Legacy `/services/*` prefix (CANONICAL_REPLACEMENT)

`/services/*` → `/solucoes/*` (all market twins included). Held by the
`ServicesRedirect` helper, not per-route entries — it is a prefix rewrite, so
the destination slug resolves through the same map as §1 plus the live
`/solucoes/:slug` router. Classified CANONICAL_REPLACEMENT: the entire prefix
is legacy and every path has a `/solucoes/*` twin.

## 3. Removed in Wave 2A.6 (REMOVE)

| Item | Action | Reason |
|---|---|---|
| Footer link `google-business-profile` | REMOVED | Retired service; no canonical route exists. |
| Footer link `consultoria-estrategica` | REMOVED | Retired service; hub `/solucoes` covers strategy. |
| Footer link `solucao-personalizada` | CANONICAL → `/solucoes` | Retired slug; hub is the custom-solutions entry. |
| Footer link `google-meta-ads` | CANONICAL → `/solucoes/paid-media` | Bypasses a soft redirect. |
| Footer link `fotografia-drone` | CANONICAL → `/solucoes/video-fotografia` | Bypasses a soft redirect. |
| Footer links `gestao-redes-sociais`, `desenvolvimento-web`, `desenvolvimento-software` | CANONICAL → `/solucoes/<same-slug>` | Were `/services/*` (prefix redirect). |
| Sitemap entries `/solucoes/hostify`, `/solucoes/qook`, `/solucoes/qook/<9 cities>` | REMOVED | Redirect-only or no-route destinations; sitemaps list canonical URLs only. |

## 4. Future host-level 301 candidates

All §1 entries (14) and the §2 `/services/*` prefix should become server-side
301s once host rewrite rules are enabled (the SPA `.htaccess` rewrite already
serves the shell; 301s are the follow-up). Until then the `<Navigate>` soft
redirects above are the sanctioned mechanism.

## 5. Known follow-ups (not redirects)

- `src/pages/Services.tsx` product card links `hostify` → `/solucoes/hostify`
  (a redirect destination) and the remaining cards link to `#`. Rebuilt in
  Wave 3 with the new IA.
- Demo query-param URLs (`/demo?produto=<slug>`) are canonical pages, not
  redirects; their hreflang set was fixed to pt-PT / en / x-default in
  Wave 2A.6.
