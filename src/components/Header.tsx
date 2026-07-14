import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analytics } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Share2, Globe, Code2, MapPin, Megaphone, Lightbulb, Plane, Sparkles, ArrowRight, Palette, PenTool, Search, Target, LayoutTemplate, ClipboardCheck, Smartphone, Cloud, Database, Layers, Shield, Rocket, Bot, MessageSquare, Headphones, Workflow, FileSearch, BarChart3, Brain, GitBranch, Newspaper, BookOpen, LineChart, Mic, Trophy, CalendarDays, Radar, Gauge, GraduationCap, Video, TrendingUp, HelpCircle, QrCode, CreditCard, LayoutGrid, CalendarCheck, Receipt, MessageCircle, Camera, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import logoNunoCruz from '@/assets/logo-getboost-soft-branca.svg';
import iconNunoCruz from '@/assets/logo-getboost-soft-branca.svg';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { SOLUCOES_SUBMENU_MAP } from '@/data/solucoesSubmenu';
import qookLogoAsset from '@/assets/qook/logo.svg.asset.json';
import qookMockupAsset from '@/assets/qook/saas.png.asset.json';
import motivaeLogo from '@/assets/logos/logo-motivae.svg';
import hostifyLogo from '@/assets/logos/logo-hostify.svg';
import hostifyMockupAsset from '@/assets/hostify/mockup.png.asset.json';
import piktoLogo from '@/assets/logos/logo-pikto.svg';
import prosafeLogo from '@/assets/logos/logo-prosafe360.svg';


type ServiceLink = { slug: string; title: string; desc: string; Icon: React.ComponentType<{ className?: string }>; to?: string };

const serviceGroups: { title: string; items: ServiceLink[] }[] = [
  {
    title: 'Marketing & Growth',
    items: [
      { slug: 'branding-identidade', title: 'Branding', desc: 'Identidade de marca memorável', Icon: Palette },
      { slug: 'marketing-digital', title: 'Marketing Digital', desc: 'Estratégia digital integrada', Icon: Megaphone },
      { slug: 'gestao-redes-sociais', title: 'Gestão de Redes Sociais', desc: 'Conteúdo estratégico e comunidade', Icon: Share2 },
      { slug: 'copywriting-conteudo', title: 'Copywriting & Conteúdo', desc: 'Textos que convertem', Icon: PenTool },
      { slug: 'seo-geo-webmcp', title: 'SEO, GEO e WebMCP', desc: 'Tráfego orgânico e visibilidade em IA', Icon: Search },
      { slug: 'paid-media', title: 'Paid Media', desc: 'Campanhas Meta, Google e TikTok com ROI', Icon: Target },
      { slug: 'email-marketing', title: 'Email Marketing', desc: 'Automação e nutrição de leads', Icon: Mail },
      { slug: 'funis-vendas', title: 'Funis de Vendas', desc: 'Jornada otimizada para conversão', Icon: GitBranch },
      { slug: 'landing-pages', title: 'Landing Pages', desc: 'Páginas focadas em resultado', Icon: LayoutTemplate },
      { slug: 'video-fotografia', title: 'Vídeo e Fotografia', desc: 'Produção audiovisual e drone', Icon: Camera },
    ],
  },
  {
    title: 'Software Engineering',
    items: [
      { slug: 'desenvolvimento-web', title: 'Desenvolvimento Web', desc: 'Websites rápidos e otimizados', Icon: Globe },
      { slug: 'desenvolvimento-mobile', title: 'Desenvolvimento Mobile', desc: 'Apps nativas e híbridas', Icon: Smartphone },
      { slug: 'desenvolvimento-saas', title: 'Desenvolvimento SaaS', desc: 'Plataformas multi-tenant', Icon: Cloud },
      { slug: 'sistemas-gestao-pmes', title: 'Sistemas de Gestão para PMEs', desc: 'ERPs à medida', Icon: Database },
      { slug: 'integracoes-erp-crm', title: 'Integrações com ERPs/CRMs', desc: 'Sistemas conectados', Icon: Workflow },
      { slug: 'ux-ui-design', title: 'UX/UI Design', desc: 'Interfaces intuitivas', Icon: Layers },
      { slug: 'mvp-30-dias', title: 'MVP em 30 dias', desc: 'Do zero ao produto em 1 mês', Icon: Rocket },
    ],
  },
  {
    title: 'Automação & IA',
    items: [
      { slug: 'agentes-ia', title: 'Agentic AI', desc: 'Agentes autónomos 24/7', Icon: Bot, to: '/agentes-ia' },
      { slug: 'bots-whatsapp-ia', title: 'WhatsApp & Conversational AI', desc: 'Atendimento 24/7', Icon: MessageSquare },
      { slug: 'crm-sales-intelligence', title: 'CRM & Sales Intelligence', desc: 'Vendas orientadas por IA', Icon: TrendingUp, to: '/crm-sales-intelligence' },
    ],
  },
];

const resourceGroups: { title: string; items: ServiceLink[] }[] = [
  {
    title: 'Materiais Gratuitos',
    items: [
      { slug: 'blog', title: 'Blog', desc: 'Estratégia, tecnologia e IA aplicadas a PMEs.', Icon: Newspaper, to: '/blog' },
      { slug: 'guias-ebooks', title: 'Guias & Ebooks', desc: 'Passo a passo para digitalizar e automatizar o teu negócio.', Icon: BookOpen, to: '/resources?categoria=guias-ebooks' },
      { slug: 'podcast', title: 'Podcast BoostTalks', desc: 'Conversas sobre crescimento, automação e futuro digital.', Icon: Mic, to: '/podcast' },
      { slug: 'casos-sucesso', title: 'Casos de Sucesso', desc: 'PMEs que escalaram com tecnologia e IA.', Icon: Trophy, to: '/casos-de-sucesso' },
    ],
  },
  {
    title: 'Ferramentas Gratuitas',
    items: [
      { slug: 'calendario-conteudo', title: 'Calendário de Conteúdo', desc: 'Planeia a tua comunicação digital com eficiência.', Icon: CalendarDays, to: '/tools/content-ideas' },
      { slug: 'analise-seo', title: 'Análise SEO', desc: 'Auditoria técnica, on-page, performance e segurança do teu site.', Icon: Radar, to: '/tools/seo-analyzer' },
      { slug: 'auditoria-digital-360', title: 'Auditoria Digital 360º', desc: 'Diagnóstico completo de website, SEO, tracking, conversão e IA.', Icon: Gauge, to: '/tools/digital-audit' },
      { slug: 'simulador-automacao', title: 'Simulador de Serviços Digitais', desc: 'Identifica processos que podem ser automatizados com IA.', Icon: Sparkles, to: '/simulador' },
    ],
  },
  {
    title: 'Formação & Comunidade',
    items: [
      { slug: 'academy', title: 'Getboost Academy', desc: 'Cursos e aulas sobre marketing, software e IA.', Icon: GraduationCap, to: '/academy' },
      { slug: 'formacao-empresas', title: 'Formação In-Company', desc: 'Programas à medida para equipas, com diagnóstico gratuito.', Icon: Users, to: '/academy/formacao-empresas' },
      { slug: 'webinars', title: 'Webinars & Workshops', desc: 'Sessões práticas com especialistas.', Icon: Video, to: '/webinars' },
      
      
    ],
  },
];

type BenefitItem = { Icon: React.ComponentType<{ className?: string }>; text: string };

type ProductInfo = {
  slug: string;
  name: string;
  tagline: string;
  subtitle?: string;
  benefits: string[];
  benefitItems?: BenefitItem[];
  gradient: string;
  to: string;
  demoHref: string;
  bgColor?: string;
  logoImg?: string;
  mockupImg?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  microcopy?: string;
};

const productInfo: Record<string, ProductInfo> = {
  qook: {
    slug: 'qook',
    name: 'Qook',
    tagline: 'O Qook é o sistema que simplifica a gestão do teu restaurante. Reservas online, menus digitais e controlo total da sala, tudo num só lugar.',
    subtitle: 'Transforma o teu restaurante com tecnologia inteligente e atendimento automatizado.',
    benefits: [],
    benefitItems: [],
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
    to: '/qook',
    demoHref: '/demo?produto=qook',
    bgColor: '#FF1C00',
    logoImg: qookLogoAsset.url,
    mockupImg: qookMockupAsset.url,
    ctaPrimary: 'Experimentar grátis',
    ctaSecondary: 'Descobre o Qook',
    microcopy: 'Sem cartão · Setup em minutos · Suporte dedicado',
  },


  motivae: {
    slug: 'motivae',
    name: 'Motivae',
    tagline: 'App de motivação com IA que acompanha equipas e aumenta produtividade.',
    benefits: [],
    gradient: 'from-fuchsia-600 via-purple-600 to-indigo-600',
    to: '/motivae',
    demoHref: '/demo?produto=motivae',
    bgColor: '#F6137E',
    logoImg: motivaeLogo,
    ctaPrimary: 'Experimentar grátis',
  },
  hostify: {
    slug: 'hostify',
    name: 'Hostify PMS',
    tagline: 'O Hostify é o PMS completo para alojamento local e boutique hotels. Gere reservas, canais, tarifários e operações num só lugar, com automação e relatórios em tempo real.',
    benefits: [],
    gradient: 'from-sky-500 via-cyan-500 to-teal-400',
    to: '/hostify',
    demoHref: '/demo?produto=hostify',
    bgColor: '#03A63C',
    logoImg: hostifyLogo,
    mockupImg: hostifyMockupAsset.url,
    ctaPrimary: 'Experimentar grátis',
  },
  pikto: {
    slug: 'pikto',
    name: 'Pikto',
    tagline: 'Geração de imagens e conteúdo visual com IA para marcas.',
    benefits: [],
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    to: '/pikto',
    demoHref: '/demo?produto=pikto',
    bgColor: '#056CF2',
    logoImg: piktoLogo,
    ctaPrimary: 'Experimentar grátis',
  },
  trackfy: {
    slug: 'trackfy',
    name: 'Trackfy',
    tagline: 'Tracking, analytics e atribuição de campanhas num só painel.',
    benefits: [],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    to: '/trackfy',
    demoHref: '/demo?produto=trackfy',
    bgColor: '#003264',
    ctaPrimary: 'Experimentar grátis',
  },
  prosafe360: {
    slug: 'prosafe360',
    name: 'ProSafe360',
    tagline: 'Plataforma de segurança e saúde no trabalho para PMEs.',
    benefits: [],
    gradient: 'from-red-600 via-orange-600 to-amber-500',
    to: '/prosafe360',
    demoHref: '/demo?produto=prosafe360',
    bgColor: '#4A99F9',
    logoImg: prosafeLogo,
    ctaPrimary: 'Experimentar grátis',
  },
};

const productGroups: { title: string; items: ServiceLink[] }[] = [
  {
    title: 'Produtos Getboost',
    items: [
      { slug: 'qook', title: 'Qook', desc: 'Plataforma para restaurantes', Icon: Rocket, to: '/qook' },
      { slug: 'motivae', title: 'Motivae', desc: 'App de motivação com IA', Icon: Sparkles, to: '/motivae' },
      { slug: 'hostify', title: 'Hostify PMS', desc: 'Gestão hoteleira', Icon: Cloud, to: '/hostify' },
      { slug: 'pikto', title: 'Pikto', desc: 'Geração visual com IA', Icon: Palette, to: '/pikto' },
      { slug: 'trackfy', title: 'Trackfy', desc: 'Tracking e analytics', Icon: LineChart, to: '/trackfy' },
      { slug: 'prosafe360', title: 'ProSafe360', desc: 'Segurança no trabalho', Icon: Shield, to: '/prosafe360' },
    ],
  },
];

type BlogPreview = { id: string; slug: string; title: string; image: string | null; category: string | null };




const Header = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | 'services' | 'products' | 'resources'>(null);
  const [mobileMenu, setMobileMenu] = useState<null | 'services' | 'products' | 'resources'>(null);
  const [latestPosts, setLatestPosts] = useState<BlogPreview[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [hoveredProduct, setHoveredProduct] = useState<string>('qook');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, slug, title, image, category')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setLatestPosts(data as BlogPreview[]); });
  }, []);

  useEffect(() => {
    if (openMenu !== 'resources' || latestPosts.length < 2) return;
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % latestPosts.length), 3500);
    return () => clearInterval(id);
  }, [openMenu, latestPosts.length]);

  const localize = (path: string) => (i18n.language === 'pt' ? path : `/${i18n.language}${path === '/' ? '' : path}`);

  const navItems: { path: string; label: string; mega?: 'services' | 'products' | 'resources' }[] = [
    { path: '/solucoes', label: t('nav.services'), mega: 'services' },
    { path: '/produtos', label: t('nav.products', 'Produtos'), mega: 'products' },
    { path: '/resources', label: t('nav.resources'), mega: 'resources' },
    
    { path: '/contact', label: t('nav.contact', 'Contacto') },
  ];



  return (
    <header className="fixed top-0 left-0 right-0 z-50" role="banner">
      {/* Main Nav */}
      <div
        className={`bg-[#0a0603] border-b border-white/10 transition-shadow duration-300 ${scrolled ? 'shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]' : ''}`}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
            <Link to={i18n.language === 'pt' ? '/' : `/${i18n.language}`} className="flex items-center gap-2">
              <img src={logoNunoCruz} alt="Getboost Digital" className="h-9 w-auto my-2 hidden lg:block object-contain" />
              <img src={iconNunoCruz} alt="Getboost Digital" className="h-7 w-auto my-2 block lg:hidden object-contain" />

            </Link>

            {/* Desktop Nav - Only for LG screens now */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {navItems.map((item) => {
                const localizedPath = localize(item.path);
                const active = location.pathname === item.path || location.pathname === localizedPath;
                const isOpen = item.mega ? openMenu === item.mega : false;

                if (item.mega) {
                  return (
                    <div
                      key={item.path}
                      className="relative"
                      onMouseEnter={() => setOpenMenu(item.mega!)}
                    >
                      <Link
                        to={localizedPath}
                        className={`relative flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.18em] transition-colors group ${active || isOpen ? 'text-[#ff4000]' : 'text-white/75 hover:text-white'}`}
                      >
                        {item.label}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180 text-[#ff4000]' : ''}`} />
                        <span className={`absolute left-0 -bottom-1.5 h-[2px] bg-[#ff4000] transition-all duration-300 ${active || isOpen ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={localizedPath}
                    className={`relative font-mono text-[12px] uppercase tracking-[0.18em] transition-colors group ${active ? 'text-[#ff4000]' : 'text-white/75 hover:text-white'}`}
                  >
                    {item.label}
                    <span className={`absolute left-0 -bottom-1.5 h-[2px] bg-[#ff4000] transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                );
              })}
            </nav>

            {/* Buttons - visible on Desktop and Tablet (lg and md) */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                onClick={() => analytics.trackClick('navigation', 'header_login', 'awareness')}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors px-3 py-2"
              >
                {t('nav.clientArea', 'Login')}
              </Link>
              <Link
                to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`}
                onClick={() => analytics.trackClick('navigation', 'header_booking', 'consideration')}
                className="group inline-flex items-center gap-2 border-2 border-[#ff4000] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff4000] hover:bg-[#ff4000] hover:text-white transition-all"
              >
                {t('nav.booking')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <LanguageSwitcher variant="minimal" />
            </div>


            {/* Toggle - visible on Mobile and Tablet (below lg) */}
            <div className="lg:hidden flex items-center gap-1">
              <span className="md:hidden"><LanguageSwitcher variant="minimal" /></span>
              <button
                className="text-white p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Full-width Mega Menu (Services or Resources) */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              key={openMenu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="hidden lg:block absolute left-0 right-0 top-full w-full bg-[#0a0603] border-t border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
              onMouseEnter={() => setOpenMenu(openMenu)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              {/* subtle orange grid overlay */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{
                  backgroundImage:
                    'linear-gradient(#ff4000 1px, transparent 1px), linear-gradient(90deg, #ff4000 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />
              <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-12 gap-10">
                  {(openMenu === 'services' ? serviceGroups : openMenu === 'products' ? productGroups : resourceGroups).map((group) => (
                    <div key={group.title} className="col-span-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff4000] mb-5 pb-3 border-b border-white/10">
                        {group.title}
                      </div>
                      <ul className="flex flex-col gap-3.5">
                        {group.items.map(({ slug, title, to }) => (
                          <li key={slug}>
                            <Link
                              to={localize(to ?? (openMenu === 'services' ? (SOLUCOES_SUBMENU_MAP[slug]?.href ?? `/solucoes/${slug}`) : `/resources#${slug}`))}
                              onClick={() => setOpenMenu(null)}
                              onMouseEnter={() => { if (openMenu === 'products' && productInfo[slug]) setHoveredProduct(slug); }}
                              className="relative inline-flex items-center gap-2 text-[14px] text-white/75 hover:text-white transition-colors group/link"
                            >
                              <span className="h-px w-0 bg-[#ff4000] transition-all duration-300 group-hover/link:w-4" />
                              {title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Right-side card */}
                  <div className={openMenu === 'products' ? 'col-span-9' : 'col-span-3'}>
                    {openMenu === 'products' ? (
                      (() => {
                        const p = productInfo[hoveredProduct] ?? productInfo.qook;
                        return (
                          <motion.div
                            key={p.slug}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`relative h-full ${p.bgColor ? '' : `bg-gradient-to-br ${p.gradient}`}`}
                            style={p.bgColor ? { backgroundColor: p.bgColor } : undefined}
                          >
                            {/* Grid overlay (same as ProductsShowcase) */}
                            {p.bgColor && (
                              <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                                style={{
                                  backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
                                  backgroundSize: '80px 80px',
                                }}
                              />
                            )}
                            <div className="relative grid grid-cols-[1fr_1.1fr] gap-6 pt-10 px-8 pb-10 h-full items-center">
                              {/* Left: content + benefits */}
                              <div className="flex flex-col text-white">
                                {p.logoImg ? (
                                  <img
                                    src={p.logoImg}
                                    alt={p.name}
                                    className="h-[3.4rem] w-auto object-contain object-left brightness-0 invert"
                                  />
                                ) : (
                                  <h4 className="text-4xl font-extrabold leading-tight">
                                    {p.name}
                                  </h4>
                                )}
                                <p className="mt-5 text-base text-white leading-relaxed max-w-[42ch]">
                                  {p.tagline}
                                </p>
                                {p.subtitle && (
                                  <p className="mt-2 text-[12px] italic text-white/85 leading-snug max-w-[36ch]">
                                    {p.subtitle}
                                  </p>
                                )}

                                <div className="mt-5">
                                  <Link
                                    to={localize(p.demoHref)}
                                    onClick={() => setOpenMenu(null)}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200"
                                  >
                                    {p.ctaPrimary ?? 'Pedir demo grátis'} <ArrowRight className="h-4 w-4" />
                                  </Link>
                                </div>

                                {p.benefitItems && p.benefitItems.length > 0 && (
                                  <ul className="mt-5 flex flex-col gap-1.5">
                                    {p.benefitItems.map((b) => (
                                      <li key={b.text} className="flex items-start gap-2 text-[12.5px] text-white leading-snug">
                                        <b.Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white" />
                                        <span>{b.text}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {(!p.benefitItems && p.benefits.length > 0) && (
                                  <ul className="mt-5 flex flex-col gap-1.5 text-white">
                                    {p.benefits.map((b) => (
                                      <li key={b} className="flex items-start gap-2 text-[12.5px]">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                                        {b}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* Right: mockup */}
                              <div className="flex items-center justify-end h-full pr-2">
                                {p.mockupImg ? (
                                  <img
                                    src={p.mockupImg}
                                    alt={`${p.name} mockup`}
                                    className="w-full h-auto max-h-[360px] object-contain object-right block"
                                  />
                                ) : null}
                              </div>


                            </div>



                          </motion.div>
                        );
                      })()
                    ) : openMenu === 'services' ? (
                      <Link
                        to={localize('/booking')}
                        onClick={() => setOpenMenu(null)}
                        className="block group"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#ff4000] border border-white/10">
                          <div
                            aria-hidden
                            className="absolute inset-0 opacity-[0.15] pointer-events-none"
                            style={{
                              backgroundImage:
                                'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                              backgroundSize: '32px 32px',
                            }}
                          />
                          <div className="absolute inset-0 flex flex-col justify-between p-6">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
                              Boost<span className="font-light italic">by</span>Getboost
                            </div>
                            <div>
                              <h4 className="text-white text-2xl font-black leading-[1.05] tracking-tight">
                                Marcar reunião com<br />especialista
                              </h4>
                              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-white/80">
                                30 min · Online · 0€
                              </p>
                              <span className="mt-5 inline-flex items-center gap-2 border-t border-white/40 pt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                                Agendar agora <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="relative aspect-[4/5] overflow-hidden bg-black border border-white/10">
                        <AnimatePresence mode="wait">
                          {latestPosts.length > 0 ? (
                            (() => {
                              const post = latestPosts[slideIdx % latestPosts.length];
                              return (
                                <motion.div
                                  key={post.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.4 }}
                                  className="absolute inset-0"
                                >
                                  <Link
                                    to={localize(`/blog/${post.slug}`)}
                                    onClick={() => setOpenMenu(null)}
                                    className="block absolute inset-0 group"
                                  >
                                    {post.image && (
                                      <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4000]">
                                        Últimos do Blog
                                      </div>
                                      <div>
                                        {post.category && (
                                          <span className="inline-block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">
                                            {post.category}
                                          </span>
                                        )}
                                        <h4 className="text-white text-lg font-black leading-tight line-clamp-3 tracking-tight">
                                          {post.title}
                                        </h4>
                                        <span className="mt-4 inline-flex items-center gap-2 border-t border-white/40 pt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                                          Ler artigo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                        </span>
                                      </div>
                                    </div>
                                  </Link>
                                </motion.div>
                              );
                            })()
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                              Sem artigos
                            </div>
                          )}
                        </AnimatePresence>
                        {latestPosts.length > 1 && (
                          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
                            {latestPosts.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSlideIdx(i)}
                                aria-label={`Ir para artigo ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all ${i === slideIdx % latestPosts.length ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Mobile/Tablet Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0a0603] border-t border-white/10 overflow-hidden"
          >
            <nav className="flex flex-col p-6 gap-5" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const localizedPath = localize(item.path);
                const active = location.pathname === item.path || location.pathname === localizedPath;

                if (item.mega) {
                  const groups = item.mega === 'services' ? serviceGroups : item.mega === 'products' ? productGroups : resourceGroups;
                  const basePath = item.mega === 'services' ? '/solucoes' : item.mega === 'products' ? '/produtos' : '/resources';
                  const isOpen = mobileMenu === item.mega;
                  return (
                    <div key={item.path} className="flex flex-col border-b border-white/10 pb-4">
                      <button
                        type="button"
                        onClick={() => setMobileMenu(isOpen ? null : item.mega!)}
                        className={`flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.2em] transition-colors ${active || isOpen ? 'text-[#ff4000]' : 'text-white/80'}`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 pl-1 flex flex-col gap-5">
                              {groups.map((group) => (
                                <div key={group.title}>
                                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4000] mb-3">
                                    {group.title}
                                  </div>
                                  <div className="flex flex-col gap-2.5">
                                    {group.items.map(({ slug, title, Icon, to }) => (
                                      <Link
                                        key={slug}
                                        to={localize(to ?? (item.mega === 'services' ? (SOLUCOES_SUBMENU_MAP[slug]?.href ?? `/solucoes/${slug}`) : `${basePath}#${slug}`))}
                                        onClick={() => { setMobileOpen(false); setMobileMenu(null); }}
                                        className="flex items-center gap-3 text-[14px] text-white/75 hover:text-white"
                                      >
                                        <span className="w-7 h-7 border border-white/15 text-[#ff4000] flex items-center justify-center">
                                          <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        {title}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <Link
                                to={localize(basePath)}
                                onClick={() => { setMobileOpen(false); setMobileMenu(null); }}
                                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff4000] mt-1"
                              >
                                {item.mega === 'services' ? 'Ver todos os serviços' : item.mega === 'products' ? 'Ver todos os produtos' : 'Ver todos os recursos'} <ArrowRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }


                return (
                  <Link
                    key={item.path}
                    to={localizedPath}
                    onClick={() => setMobileOpen(false)}
                    className={`font-mono text-[12px] uppercase tracking-[0.2em] border-b border-white/10 pb-4 transition-colors ${active ? 'text-[#ff4000]' : 'text-white/80'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* Extra buttons in mobile menu only (below md) since they are in the header for tablet (md) */}
              <div className="flex flex-col gap-3 mt-2 md:hidden">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center border border-white/20 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/85 hover:bg-white/5"
                >
                  {t('nav.clientArea', 'Login')}
                </Link>
                <Link
                  to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#ff4000] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff4000] hover:bg-[#ff4000] hover:text-white transition-all"
                >
                  {t('nav.booking')} <ArrowRight className="h-3.5 w-3.5" />
                </Link>

              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
