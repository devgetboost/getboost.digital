
CREATE TABLE public.solucao_routing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  notify_email TEXT NOT NULL DEFAULT 'nunocruz@getboost.digital',
  cc_emails TEXT[] NOT NULL DEFAULT '{}',
  brevo_list_id INTEGER,
  crm_pipeline TEXT,
  crm_stage TEXT,
  owner_name TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.solucao_routing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solucao_routing TO authenticated;
GRANT ALL ON public.solucao_routing TO service_role;

ALTER TABLE public.solucao_routing ENABLE ROW LEVEL SECURITY;

-- Public read (needed by edge function using anon and for the client fallback)
CREATE POLICY "solucao_routing readable by all"
  ON public.solucao_routing FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins manage solucao_routing"
  ON public.solucao_routing FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_solucao_routing_updated_at
  BEFORE UPDATE ON public.solucao_routing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with the current soluções slugs
INSERT INTO public.solucao_routing (slug, title, notify_email) VALUES
  ('branding-identidade', 'Branding', 'nunocruz@getboost.digital'),
  ('marketing-digital', 'Marketing Digital', 'nunocruz@getboost.digital'),
  ('gestao-redes-sociais', 'Gestão de Redes Sociais', 'nunocruz@getboost.digital'),
  ('copywriting-conteudo', 'Copywriting & Conteúdo', 'nunocruz@getboost.digital'),
  ('seo-geo-webmcp', 'SEO, GEO e WebMCP', 'nunocruz@getboost.digital'),
  ('paid-media', 'Paid Media', 'nunocruz@getboost.digital'),
  ('email-marketing', 'Email Marketing', 'nunocruz@getboost.digital'),
  ('funis-vendas', 'Funis de Vendas', 'nunocruz@getboost.digital'),
  ('landing-pages', 'Landing Pages', 'nunocruz@getboost.digital'),
  ('video-fotografia', 'Vídeo e Fotografia', 'nunocruz@getboost.digital'),
  ('desenvolvimento-web', 'Desenvolvimento Web', 'nunocruz@getboost.digital'),
  ('desenvolvimento-mobile', 'Desenvolvimento Mobile', 'nunocruz@getboost.digital'),
  ('desenvolvimento-saas', 'Desenvolvimento Software', 'nunocruz@getboost.digital'),
  ('sistemas-gestao-pmes', 'Sistemas de Gestão para PMEs', 'nunocruz@getboost.digital'),
  ('integracoes-erp-crm', 'Integrações com ERPs/CRMs', 'nunocruz@getboost.digital'),
  ('ux-ui-design', 'UX/UI Design', 'nunocruz@getboost.digital'),
  ('arquitetura-software', 'Arquitetura de Software', 'nunocruz@getboost.digital'),
  ('devops-infra', 'DevOps & Infraestrutura', 'nunocruz@getboost.digital'),
  ('seguranca-auditoria', 'Segurança & Auditoria Técnica', 'nunocruz@getboost.digital'),
  ('mvp-30-dias', 'MVP em 30 dias', 'nunocruz@getboost.digital'),
  ('agentes-ia', 'Agentic AI', 'nunocruz@getboost.digital'),
  ('bots-whatsapp-ia', 'WhatsApp & Conversational AI', 'nunocruz@getboost.digital'),
  ('crm-sales-intelligence', 'CRM & Sales Intelligence', 'nunocruz@getboost.digital');
