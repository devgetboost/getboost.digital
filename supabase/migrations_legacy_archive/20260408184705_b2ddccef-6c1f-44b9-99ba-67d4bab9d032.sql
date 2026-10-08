
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN consent boolean NOT NULL DEFAULT false,
  ADD COLUMN consented_at timestamptz;
