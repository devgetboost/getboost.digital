# Wave 1 (R1C2) target separation

| Target | `VITE_ENV` | Supabase source | How it is supplied |
| --- | --- | --- | --- |
| Local | `local` | repo `.env` | developer runs `npm run dev` locally |
| STAGING | `staging` | `jruylzhfobhjisnneyrj` | Hostinger/CI environment |
| PROD | `production` | `zwrrkbedbprgqtypglwm` | Hostinger/CI environment |

Both STAGING and PROD browser values must be supplied by the deploy platform.
They are never committed. `.env` remains the only committed env file and is
Local-only after this wave.

Selection is deliberate: `src/config/env.ts` builds the browser config once from
`VITE_ENV` + `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`, and throws
`EnvironmentConfigError` on a missing or malformed value instead of falling back.
Nothing in the application reads `import.meta.env` directly.

Project refs stay out of source. `supabase/config.toml` is CLI state and
`supabase/.temp/` is git-ignored; neither is read at runtime by the app.
