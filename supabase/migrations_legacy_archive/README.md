# Legacy migrations archive (reference only)

The 110 SQL files in this directory are the pre-2027 Supabase migration chain
(March–July 2026, Lovable-era through `20260714…`).

They are **NOT applied** to any Getboost 2027 environment:

- `getboost-staging` and `getboost-prod` apply ONLY `supabase/migrations/`
  (the Clean Database V1 chain, `20261008…`).
- This directory exists so Git history and the legacy design remain reviewable,
  and so the R1B3A/R1B3B offline backup retains a matching migration reference.
- Supabase CLI ignores this directory (it reads `supabase/migrations/` only).

Do NOT move files back. Do NOT apply these to staging or production.
See R1B3E (Clean Database V1 design) and R1B3F (implementation) for authority.
