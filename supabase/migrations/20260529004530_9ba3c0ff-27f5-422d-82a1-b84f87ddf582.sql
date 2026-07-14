
-- 1. lead_tags catalog
CREATE TABLE public.lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#ff4000',
  category text NOT NULL DEFAULT 'custom',
  auto_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tags TO authenticated;
GRANT ALL ON public.lead_tags TO service_role;

ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead tags" ON public.lead_tags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER lead_tags_updated_at
  BEFORE UPDATE ON public.lead_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. lead_tag_assignments
CREATE TABLE public.lead_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  assigned_by text NOT NULL DEFAULT 'auto',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

CREATE INDEX idx_lta_lead ON public.lead_tag_assignments(lead_id);
CREATE INDEX idx_lta_tag ON public.lead_tag_assignments(tag_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tag_assignments TO authenticated;
GRANT ALL ON public.lead_tag_assignments TO service_role;

ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead tag assignments" ON public.lead_tag_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. whatsapp_templates: associar a tag
ALTER TABLE public.whatsapp_templates
  ADD COLUMN IF NOT EXISTS tag_id uuid REFERENCES public.lead_tags(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wt_tag ON public.whatsapp_templates(tag_id);

-- 4. leads: contadores de automação
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_automation_at timestamptz,
  ADD COLUMN IF NOT EXISTS automation_count integer NOT NULL DEFAULT 0;

-- 5. Tags base (seed)
INSERT INTO public.lead_tags (slug, label, color, category, auto_rule, description) VALUES
  ('source-contact', 'Formulário Contacto', '#ff4000', 'form', '{"source":"contact"}'::jsonb, 'Lead via formulário de contacto'),
  ('source-resource', 'Download Recurso', '#2563eb', 'form', '{"source":"resource"}'::jsonb, 'Lead via descarga de recurso'),
  ('utm-google', 'Google Ads', '#34a853', 'source', '{"utm_source":"google"}'::jsonb, 'Origem Google Ads'),
  ('utm-facebook', 'Facebook Ads', '#1877f2', 'source', '{"utm_source":"facebook"}'::jsonb, 'Origem Facebook'),
  ('utm-instagram', 'Instagram', '#e1306c', 'source', '{"utm_source":"instagram"}'::jsonb, 'Origem Instagram'),
  ('utm-linkedin', 'LinkedIn', '#0a66c2', 'source', '{"utm_source":"linkedin"}'::jsonb, 'Origem LinkedIn'),
  ('channel-direct', 'Tráfego Directo', '#64748b', 'channel', '{"utm_source":"direct"}'::jsonb, 'Sem UTM')
ON CONFLICT (slug) DO NOTHING;

-- 6. Função auto-tag de leads
CREATE OR REPLACE FUNCTION public.auto_tag_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tag_rec RECORD;
  utm_slug text;
  utm_label text;
  new_tag_id uuid;
BEGIN
  -- tag por source
  IF NEW.source IS NOT NULL THEN
    FOR tag_rec IN
      SELECT id FROM public.lead_tags
      WHERE auto_rule->>'source' = NEW.source
    LOOP
      INSERT INTO public.lead_tag_assignments(lead_id, tag_id, assigned_by)
      VALUES (NEW.id, tag_rec.id, 'auto')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- tag por utm_source (match existente ou cria nova)
  IF NEW.utm_source IS NOT NULL AND length(trim(NEW.utm_source)) > 0 THEN
    SELECT id INTO new_tag_id FROM public.lead_tags
    WHERE lower(auto_rule->>'utm_source') = lower(NEW.utm_source)
    LIMIT 1;

    IF new_tag_id IS NULL THEN
      utm_slug := 'utm-' || regexp_replace(lower(NEW.utm_source), '[^a-z0-9]+', '-', 'g');
      utm_label := initcap(NEW.utm_source);
      INSERT INTO public.lead_tags(slug, label, color, category, auto_rule, description)
      VALUES (utm_slug, utm_label, '#ff4000', 'source',
              jsonb_build_object('utm_source', lower(NEW.utm_source)),
              'Tag auto-gerada de utm_source')
      ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
      RETURNING id INTO new_tag_id;
    END IF;

    INSERT INTO public.lead_tag_assignments(lead_id, tag_id, assigned_by)
    VALUES (NEW.id, new_tag_id, 'auto')
    ON CONFLICT DO NOTHING;
  ELSE
    -- direct
    SELECT id INTO new_tag_id FROM public.lead_tags WHERE slug = 'channel-direct' LIMIT 1;
    IF new_tag_id IS NOT NULL THEN
      INSERT INTO public.lead_tag_assignments(lead_id, tag_id, assigned_by)
      VALUES (NEW.id, new_tag_id, 'auto')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_tag_lead ON public.leads;
CREATE TRIGGER trg_auto_tag_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.auto_tag_lead();

-- 7. Disparar template WhatsApp ao atribuir tag
CREATE OR REPLACE FUNCTION public.trg_lead_tag_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_rec RECORD;
  tag_rec RECORD;
BEGIN
  SELECT * INTO lead_rec FROM public.leads WHERE id = NEW.lead_id;
  SELECT * INTO tag_rec FROM public.lead_tags WHERE id = NEW.tag_id;

  IF lead_rec.phone IS NULL OR length(regexp_replace(lead_rec.phone, '\D', '', 'g')) < 10 THEN
    RETURN NEW;
  END IF;

  PERFORM public.dispatch_whatsapp_trigger(
    'lead_tagged', 'lead_tag_assignments', NEW.id, lead_rec.name, lead_rec.phone,
    jsonb_build_object(
      'email', coalesce(lead_rec.email, ''),
      'empresa', coalesce(lead_rec.company, ''),
      'servico', coalesce(lead_rec.service, ''),
      'cargo', coalesce(lead_rec.cargo, ''),
      'tag', tag_rec.label,
      'tag_slug', tag_rec.slug,
      'tag_id', tag_rec.id::text,
      'utm_source', coalesce(lead_rec.utm_source, ''),
      'utm_campaign', coalesce(lead_rec.utm_campaign, '')
    )
  );

  UPDATE public.leads
    SET last_automation_at = now(), automation_count = automation_count + 1
    WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_tag_assignment_whatsapp ON public.lead_tag_assignments;
CREATE TRIGGER trg_lead_tag_assignment_whatsapp
  AFTER INSERT ON public.lead_tag_assignments
  FOR EACH ROW EXECUTE FUNCTION public.trg_lead_tag_whatsapp();
