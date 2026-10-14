import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analytics } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Menu, X, ChevronDown, Share2, Globe, Code2, MapPin, Megaphone, ArrowRight, Palette, PenTool, Search, Target, LayoutTemplate, Smartphone, Cloud, Database, Layers, Rocket, Bot, MessageSquare, Workflow, TrendingUp, GitBranch, Newspaper, BookOpen, LineChart, Mic, GraduationCap, Video, Gauge, Sparkles, Camera, Mail, Users, Trophy, Building2, Briefcase } from 'lucide-react';
import { useContentEntries } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import logoGetboost from '@/assets/logo-getboost-soft.svg';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { SOLUCOES_SUBMENU_MAP } from '@/data/solucoesSubmenu';
import { PRODUCTS } from '@/data/products';

const BRAND = '#ff4000';

type ServiceLink = { slug: string; title: string; desc: string; Icon: React.ComponentType<{ className?: string }>; to?: string };

/**
 * R18.5 — premium light navigation. Four pillar groups; every item
 * resolves through SOLUCOES_SUBMENU_MAP to its canonical destination.
 * All 20 canonical /solucoes/* slugs stay reachable (CI-guarded).
 */
const serviceGroups: { title: string; items: ServiceLink[] }[] = [
  {
    title: 'AI',
    items: [
      { slug: 'agentes-ia', title: 'Agentes de IA', desc: 'Operadores digitais 24/7', Icon: Bot, to: '/agentes-ia' },
      { slug: 'bots-whatsapp-ia', title: 'WhatsApp & Conversational AI', desc: 'Atendimento 24/7', Icon: MessageSquare },
      { slug: 'crm-sales-intelligence', title: 'CRM & Sales Intelligence', desc: 'Vendas orientadas por IA', Icon: TrendingUp, to: '/crm-sales-intelligence' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { slug: 'integracoes-erp-crm', title: 'Integrações ERP/CRM', desc: 'Sistemas conectados', Icon: Workflow },
      { slug: 'funis-vendas', title: 'Funis de Vendas', desc: 'Jornada otimizada para conversão', Icon: GitBranch },
      { slug: 'sistemas-gestao-pmes', title: 'Sistemas de Gestão', desc: 'ERPs à medida', Icon: Database },
      { slug: 'email-marketing', title: 'Email Marketing', desc: 'Automação e nutrição de leads', Icon: Mail },
    ],
  },
  {
    title: 'Software',
    items: [
      { slug: 'desenvolvimento-web', title: 'Desenvolvimento Web', desc: 'Websites rápidos e otimizados', Icon: Globe },
      { slug: 'desenvolvimento-mobile', title: 'Desenvolvimento Mobile', desc: 'Apps nativas e híbridas', Icon: Smartphone },
      { slug: 'desenvolvimento-saas', title: 'Desenvolvimento SaaS', desc: 'Plataformas multi-tenant', Icon: Cloud },
      { slug: 'ux-ui-design', title: 'UX/UI Design', desc: 'Interfaces intuitivas', Icon: Layers },
      { slug: 'mvp-30-dias', title: 'MVP em 30 dias', desc: 'Do zero ao produto em 1 mês', Icon: Rocket },
    ],
  },
  {
    title: 'Growth',
    items: [
      { slug: 'marketing-digital', title: 'Marketing Digital', desc: 'Estratégia digital integrada', Icon: Megaphone },
      { slug: 'paid-media', title: 'Paid Media', desc: 'Campanhas Meta, Google e TikTok com ROI', Icon: Target },
      { slug: 'seo-geo-webmcp', title: 'SEO, GEO e WebMCP', desc: 'Tráfego orgânico e visibilidade em IA', Icon: Search },
      { slug: 'gestao-redes-sociais', title: 'Gestão de Redes Sociais', desc: 'Conteúdo estratégico e comunidade', Icon: Share2 },
      { slug: 'copywriting-conteudo', title: 'Copywriting & Conteúdo', desc: 'Textos que convertem', Icon: PenTool },
      { slug: 'branding-identidade', title: 'Branding', desc: 'Identidade de marca memorável', Icon: Palette },
      { slug: 'landing-pages', title: 'Landing Pages', desc: 'Páginas focadas em resultado', Icon: LayoutTemplate },
      { slug: 'video-fotografia', title: 'Vídeo e Fotografia', desc: 'Produção audiovisual e drone', Icon: Camera },
    ],
  },
];

const resourceGroups: { title: string; items: ServiceLink[] }[] = [
  {
    title: 'Materiais',
    items: [
      { slug: 'blog', title: 'Blog', desc: 'Estratégia, tecnologia e IA aplicadas a PMEs.', Icon: Newspaper, to: '/blog' },
      { slug: 'guias-ebooks', title: 'Guias & Ebooks', desc: 'Passo a passo para digitalizar e automatizar o teu negócio.', Icon: BookOpen, to: '/resources?categoria=guias-ebooks' },
      { slug: 'podcast', title: 'Podcast BoostTalks', desc: 'Conversas sobre crescimento, automação e futuro digital.', Icon: Mic, to: '/podcast' },
    ],
  },
  {
    title: 'Ferramentas Gratuitas',
    items: [
      { slug: 'calendario-conteudo', title: 'Calendário de Conteúdo', desc: 'Planeia a tua comunicação digital com eficiência.', Icon: MapPin, to: '/tools/content-ideas' },
      { slug: 'analise-seo', title: 'Análise SEO', desc: 'Auditoria técnica, on-page, performance e segurança do teu site.', Icon: Search, to: '/tools/seo-analyzer' },
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

/** R18.5 — Empresa dropdown (Sobre Nós, Equipa, Portfólio, Carreiras). */
const companyItems: ServiceLink[] = [
  { slug: 'sobre-nos', title: 'Sobre Nós', desc: 'A empresa por trás da tecnologia', Icon: Building2, to: '/sobre-nos' },
  { slug: 'equipa', title: 'Equipa', desc: 'Quem constrói os teus sistemas', Icon: Users, to: '/equipa' },
  { slug: 'portfolio', title: 'Portfólio', desc: 'Projectos que já correm em produção', Icon: Trophy, to: '/portfolio' },
  { slug: 'carreira', title: 'Carreiras', desc: 'Vem construir connosco', Icon: Briefcase, to: '/carreira' },
];

type BlogPreview = { id: string; slug: string; title: string; image: string | null; category: string | null };

type MegaKey = 'services' | 'products' | 'resources' | 'company';

/**
 * R22 mega-menu refinement — the single link row for dropdown columns.
 * Reading order: icon → title (semibold, max 2 lines, reserved height so
 * rows align) → description (one line, ellipsis). No two rows compete.
 */
const MenuLink = ({
  to,
  title,
  desc,
  Icon,
  onNavigate,
}: {
  to: string;
  title: string;
  desc: string;
  Icon?: React.ComponentType<{ className?: string }>;
  onNavigate: () => void;
}) => (
  <Link
    to={to}
    onClick={onNavigate}
    className="group flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors duration-150 hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
  >
    {Icon && (
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff4000]/[0.08] text-[#ff4000] transition-colors duration-150 group-hover:bg-[#ff4000] group-hover:text-white">
        <Icon className="h-3.5 w-3.5" />
      </span>
    )}
    <span className="min-w-0">
      <span title={title} className="block min-h-[2.75em] text-[13px] font-semibold leading-snug text-ink-primary line-clamp-2">{title}</span>
      <span title={desc} className="block truncate text-xs text-ink-secondary">{desc}</span>
    </span>
  </Link>
);

const panelMotion = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22, ease: 'easeOut' as const },
};

const Header = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | MegaKey>(null);
  const [mobileMenu, setMobileMenu] = useState<null | MegaKey>(null);
  const [latestPosts, setLatestPosts] = useState<BlogPreview[]>([]);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on navigation and unlock body scroll.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // R1C6: the mega-menu "latest posts" card reads published content entries
  // through the centralized content layer instead of querying a legacy table.
  const { data: latestEntries } = useContentEntries({ contentType: 'insight', limit: 3 });
  useEffect(() => {
    if (!latestEntries) return;
    setLatestPosts(
      latestEntries.map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        image: mediaUrl(entry.ogImagePath ?? entry.coverMediaPath),
        category: entry.category?.name ?? entry.category?.key ?? null,
      })),
    );
  }, [latestEntries]);


  const localize = (path: string) => (i18n.language === 'pt' ? path : `/${i18n.language}${path === '/' ? '' : path}`);

  const navItems: { path: string; label: string; mega?: MegaKey }[] = [
    { path: '/solucoes', label: t('nav.services'), mega: 'services' },
    { path: '/produtos', label: t('nav.products', 'Produtos'), mega: 'products' },
    { path: '/insights', label: t('nav.resources'), mega: 'resources' },
    { path: '/sobre-nos', label: t('nav.company', 'Empresa'), mega: 'company' },
  ];

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;

  const serviceHref = (slug: string, to?: string) =>
    localize(to ?? (SOLUCOES_SUBMENU_MAP[slug]?.href ?? `/solucoes/${slug}`));

  return (
    <header
      className={`sticky top-0 z-50 border-b border-ink-primary/10 bg-canvas-base/85 backdrop-blur-[20px] transition-all duration-300 ${
        scrolled ? 'h-[68px] border-black/[0.07] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]' : 'h-20 border-black/[0.05]'
      }`}
      role="banner"
      onMouseLeave={() => setOpenMenu(null)}
    >
      {/* R22 mega-menu refinement: paper scrim under the panel so the open
          menu never collides with hero display type. Portalled (the sticky
          header's backdrop-filter would contain a fixed child). */}
      {typeof document !== 'undefined' && openMenu && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={() => setOpenMenu(null)}
          aria-hidden
          className="fixed inset-0 z-40 bg-[#faf7f1]/70 backdrop-blur-[3px]"
        />,
        document.body,
      )}
      <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6 md:px-12">
        {/* Left — logo */}
        <Link
          to={i18n.language === 'pt' ? '/' : `/${i18n.language}`}
          className="flex w-fit items-center justify-self-start rounded-md transition-opacity duration-200 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
          aria-label="Getboost Digital — início"
        >
          <img src={logoGetboost} alt="Getboost Digital" width={2107} height={852} className="hidden h-9 w-auto object-contain lg:block" />
          <img src={logoGetboost} alt="Getboost Digital" width={2107} height={852} className="block h-7 w-auto object-contain lg:hidden" />
        </Link>

        {/* Center — primary nav */}
        <nav className="hidden items-center gap-9 lg:flex" aria-label="Main navigation">
          {navItems.map((item, idx) => {
            const localizedPath = localize(item.path);
            const active = location.pathname === item.path || location.pathname === localizedPath;
            const isOpen = item.mega ? openMenu === item.mega : false;
            return (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => item.mega && setOpenMenu(item.mega)}
              >
                <Link
                  to={localizedPath}
                  onClick={() => item.mega && setOpenMenu(openMenu === item.mega ? null : item.mega)}
                  aria-expanded={item.mega ? isOpen : undefined}
                  aria-haspopup={item.mega ? 'true' : undefined}
                  className={`group relative flex items-center gap-1.5 py-2 text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50 ${
                    active || isOpen ? 'text-[#ff4000]' : 'text-ink-primary hover:text-black'
                  }`}
                >
                  <span aria-hidden className="font-mono text-[10px] tracking-[0.14em] text-ink-tertiary">{String(idx + 1).padStart(2, "0")}</span>{item.label}
                  {item.mega && (
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                  <span
                    className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-[#ff4000] transition-transform duration-200 ${
                      active || isOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Right — utility */}
        <div className="hidden items-center justify-self-end gap-2 md:flex">
          <Link
            to="/login"
            onClick={() => analytics.trackClick('navigation', 'header_login', 'awareness')}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors duration-200 hover:bg-black/[0.04] hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
          >
            {t('nav.clientArea', 'Login')}
          </Link>
          <Link
            to={bookingHref}
            onClick={() => analytics.trackClick('navigation', 'header_booking', 'consideration')}
            className="group inline-flex items-center gap-2 rounded-full bg-[#ff4000] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(255,64,0,0.6)] transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 hover:shadow-[0_12px_24px_-8px_rgba(255,64,0,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/60 focus-visible:ring-offset-2"
          >
            Agendar Diagnóstico
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <LanguageSwitcher variant="minimal" />
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center justify-self-end gap-1 lg:hidden">
          <span className="md:hidden"><LanguageSwitcher variant="minimal" /></span>
          <button
            className="rounded-lg p-2 text-ink-primary transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Desktop mega panels */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            key={openMenu}
            {...panelMotion}
            className="absolute inset-x-0 top-full hidden lg:block"
            onMouseEnter={() => setOpenMenu(openMenu)}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-ink-primary/10 bg-canvas-base shadow-premium">
              <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
                {openMenu === 'services' && (
                  <div>
                    <div className="grid grid-cols-12 gap-x-8">
                      {serviceGroups.filter((group) => group.title !== 'Growth').map((group) => (
                        <div key={group.title} className="col-span-4 xl:col-span-2">
                          <div className="mb-2 border-b border-black/[0.06] pb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">
                            {group.title}
                          </div>
                          <ul className="flex flex-col">
                            {group.items.map(({ slug, title, desc, Icon, to }) => (
                              <li key={slug}>
                                <MenuLink to={serviceHref(slug, to)} title={title} desc={desc} Icon={Icon} onNavigate={() => setOpenMenu(null)} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="col-span-12 mt-6 xl:col-span-6 xl:mt-0">
                        <div className="mb-2 border-b border-black/[0.06] pb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">
                          Growth
                        </div>
                        <ul className="grid grid-cols-2 gap-x-6 xl:grid-cols-2">
                          {(serviceGroups.find((group) => group.title === 'Growth')?.items ?? []).map(({ slug, title, desc, Icon, to }) => (
                            <li key={slug}>
                              <MenuLink to={serviceHref(slug, to)} title={title} desc={desc} Icon={Icon} onNavigate={() => setOpenMenu(null)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {/* Slim conversion strip: the booking CTA keeps its hierarchy
                        without the tall card dominating the panel. */}
                    <Link
                      to={localize('/booking')}
                      onClick={() => setOpenMenu(null)}
                      className="group mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-2xl border border-black/[0.06] bg-white px-7 py-4 transition-all duration-200 hover:-translate-y-px hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/60"
                    >
                      <span>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff4000]">
                          Diagnóstico gratuito
                        </span>
                        <span className="mt-1 block text-lg font-bold tracking-tight text-ink-primary">
                          Descobre o que está a travar o teu crescimento{' '}
                          <span className="font-normal text-ink-secondary">· 30 min · Online · 0€</span>
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ff4000] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(255,64,0,0.6)] transition-all duration-200 group-hover:bg-brand-700">
                        Agendar agora <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </div>
                )}

                {openMenu === 'products' && (
                  <div>
                    <div className="mb-6 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">Produtos Getboost</div>
                        <h4 className="mt-1 text-xl font-bold tracking-tight text-ink-primary">Software que operamos todos os dias</h4>
                      </div>
                      <Link
                        to={localize('/produtos')}
                        onClick={() => setOpenMenu(null)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#ff4000] transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                      >
                        Ver todos <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                      {PRODUCTS.filter((p) => p.kind === 'saas' && p.to).map((product) => (
                        <Link
                          key={product.slug}
                          to={localize(product.to as string)}
                          onClick={() => { setOpenMenu(null); analytics.trackProduct(product.slug, 'click', 'header_products'); }}
                          className="group rounded-2xl border border-black/[0.06] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.1] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                        >
                          <span className="block h-1 w-8 rounded-full" style={{ background: product.accent }} />
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[15px] font-semibold text-ink-primary">{product.name}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-[#ff4000] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </div>
                          {product.tagline && (
                            <div className="mt-0.5 line-clamp-1 text-xs font-medium text-ink-secondary">{product.tagline}</div>
                          )}
                          {product.description && (
                            <div className="mt-2 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-ink-secondary">{product.description}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                    {/* Institutional platforms: representation only, never links. */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">Plataformas</span>
                      {PRODUCTS.filter((p) => p.kind === 'platform').map((product) => (
                        <span
                          key={product.slug}
                          className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink-secondary"
                        >
                          <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: product.accent }} />
                          {product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {openMenu === 'resources' && (
                  <div className="grid grid-cols-12 gap-10">
                    {resourceGroups.map((group) => (
                      <div key={group.title} className="col-span-3">
                        <div className="mb-2 border-b border-black/[0.06] pb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">
                          {group.title}
                        </div>
                        <ul className="flex flex-col">
                          {group.items.map(({ slug, title, desc, Icon, to }) => (
                            <li key={slug}>
                              <MenuLink to={localize(to ?? `/resources#${slug}`)} title={title} desc={desc} Icon={Icon} onNavigate={() => setOpenMenu(null)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-3">
                      <div className="mb-4 border-b border-black/[0.06] pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">
                        Em destaque
                      </div>
                      {latestPosts.length > 0 ? (
                        (() => {
                          const post = latestPosts[0];
                          return (
                            <Link
                              to={localize(`/blog/${post.slug}`)}
                              onClick={() => setOpenMenu(null)}
                              className="group block overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                            >
                              {post.image && (
                                <img src={post.image} alt={post.title} loading="lazy" className="h-28 w-full object-cover" />
                              )}
                              <div className="p-4">
                                {post.category && (
                                  <span className="text-[11px] font-medium uppercase tracking-wider text-ink-secondary">{post.category}</span>
                                )}
                                <div className="mt-1 line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-ink-primary">{post.title}</div>
                                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#ff4000]">
                                  Ler artigo <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </span>
                              </div>
                            </Link>
                          );
                        })()
                      ) : (
                        <div className="flex items-center justify-center rounded-2xl border border-black/[0.06] bg-white p-8 text-sm text-ink-secondary">
                          Sem artigos
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {openMenu === 'company' && (
                  <div className="mx-auto max-w-xl">
                    <ul className="flex flex-col gap-1">
                      {companyItems.map(({ slug, title, desc, Icon, to }) => (
                        <li key={slug}>
                          <Link
                            to={localize(to ?? `/${slug}`)}
                            onClick={() => setOpenMenu(null)}
                            className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors duration-150 hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff4000]/[0.08] text-[#ff4000] transition-colors duration-150 group-hover:bg-[#ff4000] group-hover:text-white">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span>
                              <span className="block text-[15px] font-medium text-ink-primary">{title}</span>
                              <span className="block text-[13px] text-ink-secondary">{desc}</span>
                            </span>
                            <ArrowRight className="ml-auto h-4 w-4 text-ink-tertiary transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#ff4000]" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile — fullscreen overlay. Portalled to body: the sticky header's
          backdrop-filter creates a containing block that collapses fixed
          descendants to header height (the drawer rendered 79px tall). */}
      {typeof document !== 'undefined' && mobileOpen && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex flex-col bg-canvas-base lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-black/[0.06] px-6">
              <Link
                to={i18n.language === 'pt' ? '/' : `/${i18n.language}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                aria-label="Getboost Digital — início"
              >
                <img src={logoGetboost} alt="Getboost Digital" className="h-7 w-auto object-contain" />
              </Link>
              <button
                className="rounded-lg p-2 text-ink-primary transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-6" aria-label="Mobile navigation">
              <MobileSection
                id="services"
                label={t('nav.services')}
                open={mobileMenu === 'services'}
                onToggle={() => setMobileMenu(mobileMenu === 'services' ? null : 'services')}
              >
                <div className="flex flex-col gap-5 pb-2">
                  {serviceGroups.map((group) => (
                    <div key={group.title}>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">
                        {group.title}
                      </div>
                      <div className="flex flex-col">
                        {group.items.map(({ slug, title, to }) => (
                          <Link
                            key={slug}
                            to={serviceHref(slug, to)}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-lg py-2.5 text-[15px] text-ink-secondary transition-colors hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                          >
                            {title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    to={localize('/solucoes')}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[#ff4000]"
                  >
                    Ver todas as soluções <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </MobileSection>

              <MobileSection
                id="products"
                label={t('nav.products', 'Produtos')}
                open={mobileMenu === 'products'}
                onToggle={() => setMobileMenu(mobileMenu === 'products' ? null : 'products')}
              >
                <div className="flex flex-col pb-2">
                  {PRODUCTS.filter((p) => p.kind === 'saas' && p.to).map((product) => (
                    <Link
                      key={product.slug}
                      to={localize(product.to as string)}
                      onClick={() => { setMobileOpen(false); analytics.trackProduct(product.slug, 'click', 'header_products'); }}
                      className="flex items-center gap-3 rounded-lg py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                    >
                      <span className="h-6 w-1 rounded-full" style={{ background: product.accent }} />
                      <span>
                        <span className="block text-[15px] font-medium text-ink-primary">{product.name}</span>
                        {product.tagline && (
                          <span className="block text-xs text-ink-secondary">{product.tagline}</span>
                        )}
                      </span>
                    </Link>
                  ))}
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">Plataformas</span>
                    {PRODUCTS.filter((p) => p.kind === 'platform').map((product) => (
                      <span key={product.slug} className="inline-flex items-center gap-2 text-sm text-ink-secondary">
                        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: product.accent }} />
                        {product.name}
                      </span>
                    ))}
                  </div>
                </div>
              </MobileSection>

              <MobileSection
                id="resources"
                label={t('nav.resources')}
                open={mobileMenu === 'resources'}
                onToggle={() => setMobileMenu(mobileMenu === 'resources' ? null : 'resources')}
              >
                <div className="flex flex-col gap-5 pb-2">
                  {resourceGroups.map((group) => (
                    <div key={group.title}>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff4000]">
                        {group.title}
                      </div>
                      <div className="flex flex-col">
                        {group.items.map(({ slug, title, to }) => (
                          <Link
                            key={slug}
                            to={localize(to ?? '/resources')}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-lg py-2.5 text-[15px] text-ink-secondary transition-colors hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                          >
                            {title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </MobileSection>

              <MobileSection
                id="company"
                label={t('nav.company', 'Empresa')}
                open={mobileMenu === 'company'}
                onToggle={() => setMobileMenu(mobileMenu === 'company' ? null : 'company')}
              >
                <div className="flex flex-col pb-2">
                  {companyItems.map(({ slug, title, to }) => (
                    <Link
                      key={slug}
                      to={localize(to ?? `/${slug}`)}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg py-2.5 text-[15px] text-ink-secondary transition-colors hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                    >
                      {title}
                    </Link>
                  ))}
                </div>
              </MobileSection>

              <Link
                to={localize('/contact')}
                onClick={() => setMobileOpen(false)}
                className="mt-2 block border-t border-black/[0.06] py-5 text-[15px] font-medium text-ink-primary"
              >
                {t('nav.contact', 'Contacto')}
              </Link>
            </nav>

            <div className="flex shrink-0 flex-col gap-3 border-t border-black/[0.06] bg-white px-6 py-5">
              <Link
                to={bookingHref}
                onClick={() => {
                  setMobileOpen(false);
                  analytics.trackClick('navigation', 'header_booking', 'consideration');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff4000] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(255,64,0,0.6)] transition-colors hover:bg-brand-700"
              >
                Agendar Diagnóstico <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-black/[0.03]"
              >
                {t('nav.clientArea', 'Login')}
              </Link>
            </div>
            </motion.div>,
            document.body,
          )}
    </header>
  );
};

const MobileSection = ({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border-b border-black/[0.06]">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={`mobile-section-${id}`}
      className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
    >
      <span>{label}</span>
      <ChevronDown className={`h-4 w-4 text-ink-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={`mobile-section-${id}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default Header;
