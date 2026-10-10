# SPA deep-link fallback (Wave 2A.1)

**Status:** implemented in the repository — awaiting operator host verification.
**Wave:** 2027 Wave 2, Step 1 of `GETBOOST_2027_WAVE_2_EXECUTION_PLAN`.

## Hosting platform (evidence)

`docs/environment.md` records STAGING and PROD as deployed through the
**Hostinger/CI environment** — shared hosting running Apache/LiteSpeed, which
honours `.htaccess`. No Netlify/Vercel/Cloudflare configuration exists anywhere
in the repository (checked: no `_redirects`, `vercel.json`, host configs at
root or in `public/` before this wave). Vite builds with the default
root-absolute `base` (`/`), so a host rewrite to `index.html` resolves assets
correctly.

## Implementation (three layers)

| Layer | File | Mechanism |
|---|---|---|
| 1 (primary) | `public/.htaccess` | Unknown paths → `index.html`; real files/dirs (assets, sitemaps, `robots.txt`) are served untouched. `ErrorDocument 404 /404.html` covers hosts with mod_rewrite unavailable. |
| 2 (portable) | `public/404.html` | Bootstrap: stashes `pathname+search+hash` in `sessionStorage`, redirects to `/`, `noindex`. Works on any static host that serves a 404 document. |
| 3 (app) | `src/main.tsx` | Restores the stashed route with `history.replaceState` **before** `createRoot`, so React Router's first render is the requested route (`/br/*` and `/en/*` included). |

Guard: `src/tests/spa-fallback.test.ts` asserts all three layers, the
bootstrap/app sessionStorage key match, and that each required deep link
(`/`, `/solucoes`, `/agentes-ia`, `/blog`, `/portfolio`, `/resources`, `/br`,
`/en`) resolves to a real route in `src/App.tsx`.

## Operator verification checklist (production/staging)

1. Confirm `dist/.htaccess` and `dist/404.html` ship with the build (Vite
   copies `public/` contents including dotfiles — verify after deploy).
2. On the host, confirm `.htaccess` is honoured (Hostinger shared hosting does;
   confirm `AllowOverride All` is not restricted by support).
3. Post-deploy smoke (direct navigation, not in-app clicks):
   - `/solucoes`, `/agentes-ia`, `/blog`, `/portfolio`, `/resources` → 200,
     correct page rendered
   - `/br/solucoes`, `/en/solucoes` → 200, market switcher and copy correct
   - `/robots.txt`, `/sitemap.xml` → 200, served as real files (not rewritten)
   - A random asset URL (hashed JS) → 200
   - A nonsense path (e.g. `/definitely-not-a-route`) → SPA renders its own
     NotFound (HTTP 200 from the SPA shell, not a host 404)
4. If the rewrite cannot be enabled, layer 2 still restores navigation, but the
   redirect hop costs one extra request and soft-404 semantics — request the
   rewrite in that case.

## Follow-ups (not in this wave)

- Client-side `<Navigate>` redirects (legacy `/services/*` → `/solucoes/*`)
  only execute once the SPA loads; convert high-value legacy paths to
  host-level 301s after verification.
- If the frontend ever migrates to Netlify/Cloudflare/Vercel, add the matching
  artifact (`_redirects` / `vercel.json`) — the `.htaccess` layer becomes
  inert but harmless.
