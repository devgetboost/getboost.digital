import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Indica o teu nome (mínimo 2 caracteres).')
    .max(100, 'Nome demasiado longo (máx. 100 caracteres).'),
  email: z
    .string()
    .trim()
    .min(1, 'Indica o teu e-mail.')
    .max(255, 'E-mail demasiado longo.')
    .email('E-mail inválido. Exemplo: nome@empresa.com'),
  phone: z
    .string()
    .trim()
    .max(30, 'Telefone demasiado longo.')
    .refine(
      (v) => v === '' || v === '+351' || /^[+\d][\d\s\-().]{5,}$/.test(v),
      'Telefone inválido. Usa apenas dígitos, espaços e o prefixo +.',
    )
    .optional()
    .or(z.literal('')),
  country: z.string().min(1),
  companySize: z.string(),
  newsletter: z.boolean(),
});

type FieldErrors = Partial<Record<'name' | 'email' | 'phone', string>>;

const ACCENT = '#ff4000';

type AgendaItem = { time: string; title: string; detail: string };
type Metric = { value: string; label: string };

type Product = {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  agenda: AgendaItem[];
  metrics: Metric[];
  proof: string;
  backHref: string;
};

const PRODUCTS: Record<string, Product> = {
  pikto: {
    slug: 'pikto',
    name: 'Pikto',
    eyebrow: 'People Ops · Ponto · Performance',
    headline: 'Vê o Pikto a correr com a tua equipa em cima da mesa.',
    tagline: 'Ponto digital, férias, faltas e performance num só sistema — sem folhas de Excel a passar de mão em mão.',
    agenda: [
      { time: '00:05', title: 'Diagnóstico rápido', detail: 'Como registas ponto, férias e ausências hoje e onde perdes horas.' },
      { time: '00:15', title: 'Setup ao vivo', detail: 'Criamos a tua equipa demo, turnos e política de férias em minutos.' },
      { time: '00:30', title: 'Plano de adoção', detail: 'Roadmap de migração das folhas atuais e onboarding da equipa.' },
    ],
    metrics: [
      { value: '−78%', label: 'tempo em folhas de ponto' },
      { value: '3 dias', label: 'até estar em produção' },
      { value: '100%', label: 'conforme com legislação PT' },
    ],
    proof: 'Usado por equipas de retalho, restauração e serviços em Portugal.',
    backHref: '/pikto',
  },
  prosafe360: {
    slug: 'prosafe360',
    name: 'ProSafe360',
    eyebrow: 'HSE · Compliance · Auditorias',
    headline: 'Segurança do trabalho auditável, sem papel a acumular.',
    tagline: 'Risco, EPIs, formações, sinistralidade e auditorias centralizados — pronto para inspeção a qualquer momento.',
    agenda: [
      { time: '00:05', title: 'Onde está o risco hoje', detail: 'Mapeamos onde os teus registos HSE estão dispersos.' },
      { time: '00:15', title: 'Dashboard de conformidade', detail: 'Vês em tempo real o estado de formações, EPIs e auditorias.' },
      { time: '00:30', title: 'Roadmap de conformidade', detail: 'Plano concreto para chegares a 100% auditável em 30 dias.' },
    ],
    metrics: [
      { value: '0 papel', label: 'inspeções digitais end-to-end' },
      { value: '−60%', label: 'tempo a preparar auditorias' },
      { value: '24/7', label: 'alertas de não-conformidade' },
    ],
    proof: 'Preparado para NP 4397, ISO 45001 e requisitos ACT.',
    backHref: '/prosafe360',
  },
  motivae: {
    slug: 'motivae',
    name: 'Motivae',
    eyebrow: 'Coach IA · Hábitos · Performance',
    headline: 'Um coach de IA que puxa mesmo pela tua equipa.',
    tagline: 'Planos de ação personalizados, tracking de hábitos e feedback contínuo — pronto para uso individual ou B2B.',
    agenda: [
      { time: '00:05', title: 'Objetivos & contexto', detail: 'Definimos objetivo demo (individual ou equipa piloto).' },
      { time: '00:15', title: 'Coach IA em ação', detail: 'Vês plano, check-ins diários e insights de progresso.' },
      { time: '00:30', title: 'Modelo de rollout', detail: 'Como escalar dos primeiros 10 utilizadores para toda a organização.' },
    ],
    metrics: [
      { value: '+3.4x', label: 'adesão vs. apps genéricas' },
      { value: '15 min/dia', label: 'suficientes para resultados' },
      { value: 'B2B', label: 'planos por equipa e por líder' },
    ],
    proof: 'Piloto ativo com equipas comerciais e de produto.',
    backHref: '/motivae',
  },
  qook: {
    slug: 'qook',
    name: 'Qook',
    eyebrow: 'Restaurantes · Cafés · Dark Kitchens',
    headline: 'Vê o Qook a correr numa cozinha como a tua.',
    tagline: 'POS, KDS, cardápio digital, mesas, delivery e stock — tudo ligado, em tempo real, sem sistemas paralelos.',
    agenda: [
      { time: '00:05', title: 'Retrato do teu serviço', detail: 'Quantas mesas, canais de delivery, turnos e menus geres hoje.' },
      { time: '00:15', title: 'Serviço ao vivo', detail: 'Simulamos um turno real: pedido no QR, ticket na cozinha, fecho de conta e integração Uber Eats / Glovo / Bolt Food.' },
      { time: '00:30', title: 'Proposta adaptada', detail: 'Setup, hardware, integrações e prazo de arranque para o teu espaço.' },
    ],
    metrics: [
      { value: '−32%', label: 'tempo médio de fecho de conta' },
      { value: '+18%', label: 'ticket médio com upsell no QR' },
      { value: '1 ecrã', label: 'sala, cozinha, delivery e stock' },
    ],
    proof: 'Já em cozinhas de restaurantes, cafés e dark kitchens em Portugal.',
    backHref: '/qook',
  },
  hostify: {
    slug: 'hostify',
    name: 'Hostify PMS',
    eyebrow: 'PMS · Channel Manager · Booking',
    headline: 'PMS pensado para quem opera unidades boutique.',
    tagline: 'Channel manager, motor de reservas, check-in digital e faturação — tudo sincronizado com Booking, Airbnb e Expedia.',
    agenda: [
      { time: '00:05', title: 'Retrato da tua operação', detail: 'Nº de quartos, canais ligados e onde acontece overbooking.' },
      { time: '00:15', title: 'Reserva ao vivo', detail: 'Vês a reserva a entrar via Booking e a sincronizar em todos os canais.' },
      { time: '00:30', title: 'Plano de migração', detail: 'Como passar do teu PMS atual sem parar a operação.' },
    ],
    metrics: [
      { value: '0', label: 'overbookings com sync em tempo real' },
      { value: '−45%', label: 'tempo em check-in vs. balcão' },
      { value: '20+', label: 'canais e OTAs suportados' },
    ],
    proof: 'Preparado para hostels, pousadas e hotéis boutique até 120 quartos.',
    backHref: '/solucoes/hostify',
  },
  trackfy: {
    slug: 'trackfy',
    name: 'Trackfy',
    eyebrow: 'GPS · Frotas · Ativos',
    headline: 'Vê onde estão os teus veículos — mesmo agora.',
    tagline: 'Rastreamento em tempo real, cercas virtuais, alertas e relatórios de utilização — para frotas comerciais e veículos pessoais.',
    agenda: [
      { time: '00:05', title: 'Diagnóstico da frota', detail: 'Nº de veículos, condutores e onde está a fuga de custos.' },
      { time: '00:15', title: 'Live tracking', detail: 'Vês em direto localizações, cercas virtuais e alertas de comportamento.' },
      { time: '00:30', title: 'Proposta hardware + SaaS', detail: 'Hardware, instalação e subscrição adaptados à tua frota.' },
    ],
    metrics: [
      { value: '−22%', label: 'custo médio de combustível' },
      { value: '10 s', label: 'refresh de localização' },
      { value: '24/7', label: 'alertas de zona e velocidade' },
    ],
    proof: 'Instalado em frotas de distribuição, serviços técnicos e particulares.',
    backHref: '/trackfy',
  },
};

const DEFAULT_PRODUCT: Product = {
  slug: 'geral',
  name: 'Getboost',
  eyebrow: 'Software · Marketing · IA',
  headline: 'Traz o teu desafio. Sai daqui com um plano.',
  tagline: 'Sessão diagnóstica com um especialista Getboost, focada no teu contexto real.',
  agenda: [
    { time: '00:05', title: 'Contexto', detail: 'Modelo de negócio, sistemas atuais e principais bloqueios.' },
    { time: '00:15', title: 'Recomendação', detail: 'Que soluções Getboost fazem sentido e porquê.' },
    { time: '00:30', title: 'Próximos passos', detail: 'Plano com fases, esforço estimado e retorno esperado.' },
  ],
  metrics: [
    { value: '30 min', label: 'sessão focada, sem enrolar' },
    { value: '100%', label: 'sem compromisso de compra' },
    { value: '48 h', label: 'para agendar após pedido' },
  ],
  proof: 'Mais de 100 empresas apoiadas em Portugal e mercados lusófonos.',
  backHref: '/',
};

const COMPANY_SIZES_PT = ['1 pessoa', '2-10', '11-50', '51-200', '201-500', '500+'];

// Multilingual overrides for Qook (pt/en/es). Other products stay in PT.
type Lang = 'pt' | 'en' | 'es';
const SUPPORTED_LANGS: Lang[] = ['pt', 'en', 'es'];
const MULTILINGUAL_SLUGS = new Set(['qook']);

const QOOK_I18N: Record<Lang, Partial<Product>> = {
  pt: {},
  en: {
    eyebrow: 'Restaurants · Cafés · Dark Kitchens',
    headline: 'See Qook running in a kitchen like yours.',
    tagline: 'POS, KDS, digital menu, tables, delivery and stock — all connected, in real time, without parallel systems.',
    agenda: [
      { time: '00:05', title: 'Snapshot of your service', detail: 'How many tables, delivery channels, shifts and menus you handle today.' },
      { time: '00:15', title: 'Live service', detail: 'We simulate a real shift: QR order, kitchen ticket, bill closing and Uber Eats / Glovo / Bolt Food integration.' },
      { time: '00:30', title: 'Tailored proposal', detail: 'Setup, hardware, integrations and go-live timeline for your venue.' },
    ],
    metrics: [
      { value: '−32%', label: 'average bill closing time' },
      { value: '+18%', label: 'average ticket with QR upsell' },
      { value: '1 screen', label: 'floor, kitchen, delivery and stock' },
    ],
    proof: 'Already live in restaurants, cafés and dark kitchens in Portugal.',
  },
  es: {
    eyebrow: 'Restaurantes · Cafeterías · Dark Kitchens',
    headline: 'Ve Qook funcionando en una cocina como la tuya.',
    tagline: 'TPV, KDS, carta digital, mesas, delivery y stock — todo conectado, en tiempo real, sin sistemas paralelos.',
    agenda: [
      { time: '00:05', title: 'Retrato de tu servicio', detail: 'Cuántas mesas, canales de delivery, turnos y cartas gestionas hoy.' },
      { time: '00:15', title: 'Servicio en directo', detail: 'Simulamos un turno real: pedido por QR, ticket en cocina, cierre de cuenta e integración Uber Eats / Glovo / Bolt Food.' },
      { time: '00:30', title: 'Propuesta a medida', detail: 'Setup, hardware, integraciones y plazo de arranque para tu local.' },
    ],
    metrics: [
      { value: '−32%', label: 'tiempo medio de cierre de cuenta' },
      { value: '+18%', label: 'ticket medio con upsell en QR' },
      { value: '1 pantalla', label: 'sala, cocina, delivery y stock' },
    ],
    proof: 'Ya en cocinas de restaurantes, cafeterías y dark kitchens en Portugal.',
  },
};

type UIStrings = {
  back: string; whatSee: string; duration: string; noCommit: string; humanExpert: string;
  request: string; reserve: string; reference: string; name: string; namePh: string;
  email: string; country: string; phone: string; companySize: string; selectSize: string;
  newsletter: string; termsBefore: string; termsLink: string; submit: string; submitting: string;
  reply: string; countries: string[]; sizes: string[];
  fallbackNoProductInvalid: (slug: string) => React.ReactNode;
  fallbackNoProduct: React.ReactNode;
  seeAllProducts: string;
  seoTitle: (name: string, eyebrow: string) => string;
  seoDescription: (name: string, tagline: string) => string;
};

const UI_I18N: Record<Lang, UIStrings> = {
  pt: {
    back: '← Voltar para', whatSee: 'O que vais ver · 30 minutos', duration: '30 min · via Meet',
    noCommit: 'Sem compromisso', humanExpert: 'Especialista humano',
    request: 'Pedido', reserve: 'Reserva a tua demonstração', reference: 'Referência:',
    name: 'Nome', namePh: 'O teu nome', email: 'E-mail comercial', country: 'País', phone: 'Telefone',
    companySize: 'Tamanho da empresa', selectSize: 'Seleciona o tamanho',
    newsletter: 'Quero receber novidades, eventos e ofertas da Getboost. Sem spam.',
    termsBefore: 'Ao clicar em Solicitar demonstração, aceitas os nossos',
    termsLink: 'Termos e Política de Privacidade',
    submit: 'Solicitar demonstração', submitting: 'A enviar...', reply: 'Resposta em menos de 48 h',
    countries: ['Portugal', 'Brasil', 'Espanha', 'França', 'Reino Unido', 'Estados Unidos', 'Outro'],
    sizes: COMPANY_SIZES_PT,
    fallbackNoProductInvalid: (slug) => <>Não reconhecemos <span className="font-semibold text-white">"{slug}"</span>. Podes enviar um pedido geral abaixo ou escolher um produto específico.</>,
    fallbackNoProduct: <>Não selecionaste um produto. Envia um pedido geral abaixo ou escolhe primeiro um produto específico.</>,
    seeAllProducts: 'Ver todos os produtos',
    seoTitle: (n, e) => `Demonstração ${n} — ${e}`,
    seoDescription: (n, t) => `Demo gratuita de 30 min do ${n}. ${t}`,
  },
  en: {
    back: '← Back to', whatSee: "What you'll see · 30 minutes", duration: '30 min · via Meet',
    noCommit: 'No commitment', humanExpert: 'Human specialist',
    request: 'Request', reserve: 'Book your demo', reference: 'Reference:',
    name: 'Name', namePh: 'Your name', email: 'Business email', country: 'Country', phone: 'Phone',
    companySize: 'Company size', selectSize: 'Select size',
    newsletter: 'I want to receive news, events and offers from Getboost. No spam.',
    termsBefore: 'By clicking Book demo, you accept our',
    termsLink: 'Terms and Privacy Policy',
    submit: 'Book demo', submitting: 'Sending...', reply: 'Reply within 48 h',
    countries: ['Portugal', 'Brazil', 'Spain', 'France', 'United Kingdom', 'United States', 'Other'],
    sizes: ['1 person', '2-10', '11-50', '51-200', '201-500', '500+'],
    fallbackNoProductInvalid: (slug) => <>We don't recognize <span className="font-semibold text-white">"{slug}"</span>. You can send a general request below or pick a specific product.</>,
    fallbackNoProduct: <>You haven't selected a product. Send a general request below or pick a specific product first.</>,
    seeAllProducts: 'See all products',
    seoTitle: (n, e) => `${n} demo — ${e}`,
    seoDescription: (n, t) => `Free 30-min ${n} demo. ${t}`,
  },
  es: {
    back: '← Volver a', whatSee: 'Lo que vas a ver · 30 minutos', duration: '30 min · vía Meet',
    noCommit: 'Sin compromiso', humanExpert: 'Especialista humano',
    request: 'Solicitud', reserve: 'Reserva tu demostración', reference: 'Referencia:',
    name: 'Nombre', namePh: 'Tu nombre', email: 'Email corporativo', country: 'País', phone: 'Teléfono',
    companySize: 'Tamaño de la empresa', selectSize: 'Selecciona el tamaño',
    newsletter: 'Quiero recibir novedades, eventos y ofertas de Getboost. Sin spam.',
    termsBefore: 'Al hacer clic en Solicitar demostración, aceptas nuestros',
    termsLink: 'Términos y Política de Privacidad',
    submit: 'Solicitar demostración', submitting: 'Enviando...', reply: 'Respuesta en menos de 48 h',
    countries: ['Portugal', 'Brasil', 'España', 'Francia', 'Reino Unido', 'Estados Unidos', 'Otro'],
    sizes: ['1 persona', '2-10', '11-50', '51-200', '201-500', '500+'],
    fallbackNoProductInvalid: (slug) => <>No reconocemos <span className="font-semibold text-white">"{slug}"</span>. Puedes enviar una solicitud general abajo o elegir un producto específico.</>,
    fallbackNoProduct: <>No has seleccionado un producto. Envía una solicitud general abajo o elige primero un producto específico.</>,
    seeAllProducts: 'Ver todos los productos',
    seoTitle: (n, e) => `Demo de ${n} — ${e}`,
    seoDescription: (n, t) => `Demo gratuita de 30 min de ${n}. ${t}`,
  },
};

const LANG_LABEL: Record<Lang, string> = { pt: 'PT', en: 'EN', es: 'ES' };

export default function DemoRequest() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const ALLOWED_SLUGS = Object.keys(PRODUCTS);
  const rawSlug = params.get('produto');
  const normalizedSlug = (rawSlug ?? '').trim().toLowerCase();

  const productStatus: 'missing' | 'invalid' | 'valid' =
    rawSlug === null || normalizedSlug === ''
      ? 'missing'
      : ALLOWED_SLUGS.includes(normalizedSlug)
        ? 'valid'
        : 'invalid';

  const isInvalid = productStatus === 'invalid';
  const showFallbackNotice = productStatus !== 'valid';

  const isMultilingual = productStatus === 'valid' && MULTILINGUAL_SLUGS.has(normalizedSlug);
  const rawLang = (params.get('lang') ?? '').trim().toLowerCase() as Lang;
  const lang: Lang = isMultilingual && SUPPORTED_LANGS.includes(rawLang) ? rawLang : 'pt';
  const t = UI_I18N[lang];

  const baseProduct = productStatus === 'valid' ? PRODUCTS[normalizedSlug] : DEFAULT_PRODUCT;
  const product = useMemo<Product>(() => {
    if (isMultilingual && normalizedSlug === 'qook') {
      return { ...baseProduct, ...QOOK_I18N[lang] } as Product;
    }
    return baseProduct;
  }, [baseProduct, isMultilingual, lang, normalizedSlug]);

  const setLang = (next: Lang) => {
    const sp = new URLSearchParams(params);
    if (next === 'pt') sp.delete('lang');
    else sp.set('lang', next);
    navigate({ pathname: '/demo', search: `?${sp.toString()}` }, { replace: true });
  };

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    country: 'Portugal',
    phone: '+351 ',
    companySize: '',
    newsletter: false,
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error('Corrige os campos assinalados antes de enviar.');
      return;
    }
    setErrors({});

    const data = parsed.data;
    setSubmitting(true);
    const message = `Pedido de demonstração — ${product.name}\nPaís: ${data.country}\nTamanho da empresa: ${data.companySize || 'n/d'}\nNewsletter: ${data.newsletter ? 'sim' : 'não'}`;

    const { error } = await supabase.from('leads').insert({
      source: `demo:${product.slug}`,
      name: data.name,
      email: data.email,
      phone: data.phone?.trim() || null,
      company: null,
      service: product.name,
      resource_id: product.slug,
      resource_name: product.name,
      message,
    });

    if (error) {
      setSubmitting(false);
      const msg = /network|fetch|Failed to fetch/i.test(error.message)
        ? 'Sem ligação à internet. Verifica a tua rede e tenta novamente.'
        : /row-level security|permission|denied/i.test(error.message)
          ? 'Não temos permissão para guardar o pedido. Contacta-nos diretamente por email.'
          : /duplicate|unique/i.test(error.message)
            ? 'Já existe um pedido recente com este e-mail. Vamos responder-te em breve.'
            : `Não foi possível enviar o pedido: ${error.message}`;
      toast.error(msg);
      analytics.trackForm('demo', 'demo_form_error', { product: product.slug, error: error.message });
      return;
    }

    const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'lead-notification',
        recipientEmail: 'nunocruz@getboost.digital',
        templateData: {
          name: data.name,
          email: data.email,
          phone: data.phone?.trim() || null,
          company: null,
          service: product.name,
          message,
          source: `Demo — ${product.name}`,
          language: 'pt',
        },
      },
    });

    setSubmitting(false);

    if (emailError) {
      // Lead was saved in CRM even if the notification email failed.
      toast.warning('Pedido guardado, mas a notificação por email falhou. Vamos rever manualmente.');
      analytics.trackForm('demo', 'demo_form_email_error', { product: product.slug, error: emailError.message });
    } else {
      toast.success('Pedido enviado! Entramos em contacto muito em breve.');
    }
    analytics.trackForm('demo', 'demo_form_success', { product: product.slug, path: location.pathname });
    setForm({ name: '', email: '', country: 'Portugal', phone: '+351 ', companySize: '', newsletter: false });
    navigate(`/demo/obrigado?produto=${product.slug}`, {
      state: {
        name: data.name,
        email: data.email,
        phone: data.phone?.trim() || null,
        companySize: data.companySize || null,
        productName: product.name,
        productSlug: product.slug,
        submittedAt: new Date().toISOString(),
        emailDelivered: !emailError,
      },
    });
  };


  const isValid = productStatus === 'valid';
  const seoTitle = isValid
    ? t.seoTitle(product.name, product.eyebrow)
    : 'Pedir demonstração — Software, Marketing & IA';
  const seoDescription = isValid
    ? t.seoDescription(product.name, product.tagline)
    : 'Agenda uma sessão diagnóstica gratuita de 30 min com um especialista Getboost. Software, marketing digital e IA.';
  const seoCanonical = isValid
    ? `/demo?produto=${product.slug}${isMultilingual && lang !== 'pt' ? `&lang=${lang}` : ''}`
    : '/demo';
  const seoUrl = `https://getboostsoft.lovable.app${seoCanonical}`;

  const jsonLd: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://getboostsoft.lovable.app/' },
        ...(isValid
          ? [
              { '@type': 'ListItem', position: 2, name: 'Soluções', item: 'https://getboostsoft.lovable.app/solucoes' },
              { '@type': 'ListItem', position: 3, name: product.name, item: `https://getboostsoft.lovable.app${product.backHref}` },
              { '@type': 'ListItem', position: 4, name: `Demo ${product.name}`, item: seoUrl },
            ]
          : [{ '@type': 'ListItem', position: 2, name: 'Pedir demonstração', item: seoUrl }]),
      ],
    },
    isValid
      ? {
          '@type': 'Product',
          name: product.name,
          description: product.tagline,
          brand: { '@type': 'Brand', name: 'Getboost Digital' },
          category: product.eyebrow,
          url: `https://getboostsoft.lovable.app${product.backHref}`,
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'EUR',
            price: '0',
            url: seoUrl,
            description: `Demonstração gratuita de 30 minutos do ${product.name}.`,
          },
        }
      : {
          '@type': 'Service',
          name: 'Demonstração Getboost Digital',
          description: seoDescription,
          provider: { '@type': 'Organization', name: 'Getboost Digital', url: 'https://getboostsoft.lovable.app' },
          areaServed: ['Portugal', 'Brasil', 'Spain'],
          url: seoUrl,
        },
    {
      '@type': 'WebPage',
      name: seoTitle,
      description: seoDescription,
      url: seoUrl,
      inLanguage: lang === 'en' ? 'en' : lang === 'es' ? 'es' : 'pt-PT',
      isPartOf: { '@type': 'WebSite', name: 'Getboost Digital', url: 'https://getboostsoft.lovable.app' },
      potentialAction: {
        '@type': 'ScheduleAction',
        target: seoUrl,
        name: isValid ? `Agendar demo ${product.name}` : 'Agendar demonstração',
      },
    },
  ];

  if (isInvalid) {
    return (
      <Layout>
        <SEO
          title="Produto não encontrado"
          description="O produto indicado no link de demonstração não foi reconhecido. Escolhe um produto válido ou envia um pedido geral."
          canonical="/demo"
          noIndex
        />
        <section className="relative overflow-hidden bg-[#0a0603] text-white min-h-[calc(100vh-3.5rem)] flex items-center">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%)',
            }}
          />
          <div className="relative max-w-2xl mx-auto px-6 py-24 text-center">
            <div
              className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] mb-6"
              style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
              Erro 404 · Produto
            </div>
            <h1 className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,5vw,3.5rem)]">
              Não encontrámos o produto <span style={{ color: ACCENT }}>"{rawSlug}"</span>.
            </h1>
            <p className="mt-6 text-lg text-white/70">
              O link que seguiste aponta para um produto que não existe no nosso catálogo.
              Podes escolher um produto válido, voltar ao pedido geral de demonstração ou explorar todas as soluções.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full bg-[#ff4000] hover:bg-[#ff4000]/90 text-white font-semibold">
                <Link to="/demo">Pedido de demo geral <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                <Link to="/solucoes">Ver todos os produtos</Link>
              </Button>
            </div>
            <p className="mt-8 text-xs font-mono uppercase tracking-[0.22em] text-white/40">
              Produtos disponíveis: {ALLOWED_SLUGS.join(' · ')}
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  const SITE_URL_DEMO = 'https://getboostsoft.lovable.app';
  const buildDemoUrl = (l: Lang) => {

    if (!isValid) return `${SITE_URL_DEMO}/demo`;
    const base = `${SITE_URL_DEMO}/demo?produto=${product.slug}`;
    return l === 'pt' ? base : `${base}&lang=${l}`;
  };
  const demoAlternates = isValid
    ? [
        { lang: 'pt', href: buildDemoUrl('pt') },
        { lang: 'en', href: buildDemoUrl('en') },
        { lang: 'es', href: buildDemoUrl('es') },
        { lang: 'x-default', href: buildDemoUrl('pt') },
      ]
    : undefined;

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        type="website"
        jsonLd={jsonLd}
        lang={lang}
        alternates={demoAlternates}
      />


      {/* HERO — /agentes-ia style */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/3 h-[620px] w-[620px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-start">
          {/* LEFT */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {isMultilingual && (
              <div
                role="group"
                aria-label="Language selector"
                className="mb-6 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1"
              >
                {SUPPORTED_LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.22em] transition-colors ${
                      lang === l ? 'bg-[#ff4000] text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {LANG_LABEL[l]}
                  </button>
                ))}
              </div>
            )}

            {showFallbackNotice ? (
              <div className="mb-6 rounded-2xl border border-[#ff4000]/30 bg-[#ff4000]/5 p-5">
                <p className="text-sm text-white/85">
                  {isInvalid ? t.fallbackNoProductInvalid(rawSlug ?? '') : t.fallbackNoProduct}
                </p>
                <Button asChild size="sm" className="mt-4 rounded-full bg-[#ff4000] hover:bg-[#ff4000]/90 text-white font-semibold">
                  <Link to="/solucoes">{t.seeAllProducts} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <Link
                to={product.backHref}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-white/60 hover:text-[#ffb494] transition-colors mb-8"
              >
                {t.back} {product.name}
              </Link>
            )}

            <div
              className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
              style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
              {product.eyebrow}
            </div>

            <h1 className="mt-6 font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,5.5vw,4.5rem)]">
              {product.headline.split(product.name).map((chunk, i, arr) => (
                <span key={i}>
                  {chunk}
                  {i < arr.length - 1 && <span style={{ color: ACCENT }}>{product.name}</span>}
                </span>
              ))}
            </h1>

            <p className="mt-6 text-lg text-white/70 max-w-xl">{product.tagline}</p>

            {/* Metrics strip */}
            <div className="mt-10 grid grid-cols-3 gap-4 md:gap-6 border-t border-white/10 pt-6">
              {product.metrics.map((m) => (
                <div key={m.label}>
                  <div className="font-black text-2xl md:text-3xl" style={{ color: ACCENT }}>{m.value}</div>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-white/50 leading-snug">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Agenda */}
            <div className="mt-10">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/50 mb-4">
                {t.whatSee}
              </div>
              <ol className="space-y-3">
                {product.agenda.map((item) => (
                  <li key={item.time} className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#ff4000]/40 transition-colors">
                    <div className="font-mono text-xs text-[#ffb494] w-14 pt-0.5 shrink-0">{item.time}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm text-white/60 leading-relaxed">{item.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-white/55">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" style={{ color: ACCENT }} /> {t.duration}</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" style={{ color: ACCENT }} /> {t.noCommit}</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} /> {t.humanExpert}</span>
            </div>
            <p className="mt-4 text-xs text-white/45">{product.proof}</p>
          </motion.div>


          {/* RIGHT — form card, dark glass */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/40"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#ff4000]/60 to-transparent" />

            <input type="hidden" name="produto" value={product.slug} />
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/50">{t.request}</div>
            <h2 className="mt-1 text-2xl md:text-3xl font-bold text-white">{t.reserve}</h2>
            <p className="mt-2 text-sm text-white/60">
              {t.reference} <span className="font-semibold text-white">{product.name}</span>
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="demo-name" className="text-xs font-medium text-white/70 mb-1.5 block uppercase tracking-wider">{t.name}</label>
                <Input
                  id="demo-name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t.namePh}
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'demo-name-error' : undefined}
                  className={`bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/60 ${errors.name ? 'border-red-500/70' : 'border-white/10'}`}
                />
                {errors.name && <p id="demo-name-error" role="alert" className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="demo-email" className="text-xs font-medium text-white/70 mb-1.5 block uppercase tracking-wider">{t.email}</label>
                <Input
                  id="demo-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="nome@empresa.com"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'demo-email-error' : undefined}
                  className={`bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/60 ${errors.email ? 'border-red-500/70' : 'border-white/10'}`}
                />
                {errors.email && <p id="demo-email-error" role="alert" className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/70 mb-1.5 block uppercase tracking-wider">{t.country}</label>
                  <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {t.countries.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="demo-phone" className="text-xs font-medium text-white/70 mb-1.5 block uppercase tracking-wider">{t.phone}</label>
                  <Input
                    id="demo-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+351 ..."
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'demo-phone-error' : undefined}
                    className={`bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/60 ${errors.phone ? 'border-red-500/70' : 'border-white/10'}`}
                  />
                  {errors.phone && <p id="demo-phone-error" role="alert" className="mt-1.5 text-xs text-red-400">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/70 mb-1.5 block uppercase tracking-wider">{t.companySize}</label>
                <Select value={form.companySize} onValueChange={(v) => setForm({ ...form, companySize: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder={t.selectSize} /></SelectTrigger>
                  <SelectContent>
                    {t.sizes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.newsletter}
                  onCheckedChange={(v) => setForm({ ...form, newsletter: !!v })}
                  className="mt-0.5 border-white/30 data-[state=checked]:bg-[#ff4000] data-[state=checked]:border-[#ff4000]"
                />
                <span className="text-xs text-white/60 leading-relaxed">
                  {t.newsletter}
                </span>
              </label>

              <p className="text-[11px] text-white/40 leading-relaxed">
                {t.termsBefore}{' '}
                <Link to="/politica-privacidade" className="text-[#ffb494] underline underline-offset-2 hover:text-white">
                  {t.termsLink}
                </Link>.
              </p>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full rounded-full bg-[#ff4000] hover:bg-[#ff4000]/90 text-white font-semibold h-12 shadow-lg shadow-[#ff4000]/30"
              >
                {submitting ? t.submitting : t.submit}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                {t.reply}
              </p>
            </div>
          </motion.form>

        </div>
      </section>
    </Layout>
  );
}
