import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper, BookOpen, Mic, GraduationCap, Video, Gauge, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { useContentEntries } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';

const ACCENT = '#ff4000';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const surfaces = [
  {
    key: 'resources',
    title: 'Recursos',
    body: 'Guias, ebooks e materiais práticos para digitalizar e automatizar o teu negócio — sem custo.',
    icon: BookOpen,
    to: '/resources',
  },
  {
    key: 'podcast',
    title: 'Podcast BoostTalks',
    body: 'Conversas sobre crescimento, automação e o futuro digital com quem está a construir.',
    icon: Mic,
    to: '/podcast',
  },
  {
    key: 'academy',
    title: 'Getboost Academy',
    body: 'Cursos e aulas sobre marketing, software e IA — para ti e para a tua equipa.',
    icon: GraduationCap,
    to: '/academy',
  },
  {
    key: 'webinars',
    title: 'Webinars & Workshops',
    body: 'Sessões práticas com especialistas, do diagnóstico à execução.',
    icon: Video,
    to: '/webinars',
  },
];

const tools = [
  { title: 'Análise SEO', to: '/tools/seo-analyzer' },
  { title: 'Calendário de Conteúdo', to: '/tools/content-ideas' },
  { title: 'Auditoria Digital 360º', to: '/tools/digital-audit' },
  { title: 'Simulador de Serviços', to: '/simulador' },
  { title: 'Calculadora de ROI', to: '/tools/roi-calculator' },
  { title: 'Guia de Branding', to: '/tools/branding-guide' },
];

/**
 * Getboost 2027 — Wave 3E · INSIGHTS hub.
 * The content index: blog, resources, podcast, academy, webinars and
 * free tools, on the Wave 3A design system. Existing content surfaces
 * stay canonical; this hub is their entry point.
 */
const Insights = () => {
  const { i18n } = useTranslation();
  const { data: latestEntries } = useContentEntries({ contentType: 'insight', limit: 3 });
  const prefix = i18n.language === 'pt' ? '' : `/${i18n.language}`;

  return (
    <Layout>
      <SEO
        title="Insights — Blog, Recursos, Podcast e Formação | Getboost Digital"
        description="Conhecimento que aplicamos todos os dias: artigos, guias, podcast, academy, webinars e ferramentas gratuitas sobre marketing, software e IA."
        canonical="/insights"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ============================================================ HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-36 md:!pt-44">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="gb-eyebrow inline-flex items-center gap-2 rounded-full border border-sand-200 px-3 py-1.5 text-brand-600">
              <Newspaper className="h-3.5 w-3.5" />
              Insights
            </span>
            <h1 className="gb-text-display mt-6 max-w-4xl text-ink-primary">
              Conhecimento que{' '}
              <span className="text-brand-600">aplicamos</span> todos os dias.
            </h1>
            <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">
              Artigos, guias, podcast, formação e ferramentas gratuitas — tudo o
              que produzimos para PMEs que querem crescer com tecnologia,
              automação e inteligência artificial.
            </p>
          </motion.div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ============================================================ BLOG */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Blog"
            title="Os artigos mais recentes"
            description="Estratégia, tecnologia e IA aplicadas a PMEs — escrito por quem executa."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(latestEntries ?? []).slice(0, 3).map((entry, i) => (
              <motion.div
                key={entry.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Link to={`/blog/${entry.slug}`} className="group block h-full">
                  <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                    {entry.ogImagePath ?? entry.coverMediaPath ? (
                      <img
                        src={mediaUrl(entry.ogImagePath ?? entry.coverMediaPath) ?? ''}
                        alt={entry.title}
                        className="mb-5 h-40 w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <h3 className="gb-text-h3 text-ink-primary">{entry.title}</h3>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Ler artigo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
            {!latestEntries?.length ? (
              <p className="gb-text-body text-ink-secondary">Sem artigos publicados de momento.</p>
            ) : null}
          </div>
          <div className="mt-8">
            <Button asChild variant="ghost">
              <Link to={`${prefix}/blog`}>
                Ver todos os artigos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================ RESOURCES/PODCAST/ETC */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Mais superfícies"
            title="Recursos, podcast, academy e webinars"
            description="Cada superfície tem página própria — explora a que faz sentido para ti."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {surfaces.map((surface, i) => (
              <motion.div
                key={surface.key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Link to={`${prefix}${surface.to}`} className="group block h-full">
                  <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-tint text-brand-600">
                      <surface.icon className="h-5 w-5" />
                    </span>
                    <h3 className="gb-text-h3 mt-5 text-ink-primary">{surface.title}</h3>
                    <p className="gb-text-body mt-3 text-ink-secondary">{surface.body}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Explorar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================== TOOLS */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Ferramentas gratuitas"
            title="Ferramentas para agir hoje"
            description="Diagnósticos e calculadoras que podes usar já — sem custo, sem compromisso."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.to}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i % 3}
              >
                <Link to={`${prefix}${tool.to}`} className="group block h-full">
                  <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-tint text-brand-600">
                      <Gauge className="h-5 w-5" />
                    </span>
                    <h3 className="gb-text-h3 mt-4 text-ink-primary">{tool.title}</h3>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Usar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== CTA BAND */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}>
            <div className="gb-cta-band text-center">
              <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                Pronto para passar do insight à{' '}
                <span style={{ color: ACCENT }}>acção?</span>
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Marcamos 30 minutos, online e sem custo — saís com um plano
                concreto para o teu negócio.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to={`${prefix}/booking`}>
                    Agendar reunião <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                  <Link to={`${prefix}/contact`}>
                    Falar com um consultor <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Insights;
