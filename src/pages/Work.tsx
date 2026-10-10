import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutTemplate, Trophy } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { METRICS } from '@/data/brandRegistry';

const ACCENT = '#ff4000';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const proof = [
  { k: '+300%', v: 'crescimento orgânico médio em 6 meses' },
  { k: '−70%', v: 'tempo em tarefas administrativas' },
  { k: '5x', v: 'reuniões comerciais qualificadas' },
  { k: METRICS.projectsDelivered.value, v: 'projetos entregues em produção' },
];

/**
 * Getboost 2027 — Wave 3E · WORK hub.
 * The delivery-proof index: portfolio + case studies, on the Wave 3A
 * design system. The existing /portfolio and /casos-de-sucesso surfaces
 * stay canonical; this hub is their entry point.
 */
const Work = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Trabalhos — Portefólio e Casos de Sucesso | Getboost Digital"
        description="Projectos entregues e casos de sucesso: software, agentes de IA e growth a correr em produção, com resultados mensuráveis."
        canonical="/work"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ============================================================ HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-36 md:!pt-44">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="gb-eyebrow inline-flex items-center gap-2 rounded-full border border-sand-200 px-3 py-1.5 text-brand-600">
              Trabalhos
            </span>
            <h1 className="gb-text-display mt-6 max-w-4xl text-ink-primary">
              Projectos que já correm em{' '}
              <span className="text-brand-600">produção</span>.
            </h1>
            <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">
              Do PMS que corre em centenas de propriedades ao SaaS de segurança
              no trabalho, do POS para restauração ao coach emocional com IA —
              construímos, mantemos e escalamos produtos digitais reais, com
              utilizadores reais, todos os dias.
            </p>
          </motion.div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ======================================================= PORTFOLIO */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Portefólio"
            title="Projectos selecionados"
            description="Cada projecto é uma parceria única. Explora o portefólio completo com contexto, solução e resultado."
          />
          <div className="mt-12">
            <Link to={i18n.language === 'pt' ? '/portfolio' : `/${i18n.language}/portfolio`} className="group block">
              <div className="gb-surface-card transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-tint text-brand-600">
                  <LayoutTemplate className="h-5 w-5" />
                </span>
                <h3 className="gb-text-h3 mt-5 text-ink-primary">Ver portefólio completo</h3>
                <p className="gb-text-body mt-3 max-w-2xl text-ink-secondary">
                  Websites, plataformas SaaS, apps e sistemas de gestão
                  entregues a clientes em Portugal e no Brasil.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                  Explorar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================== CASE STUDIES */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Casos de sucesso"
            title="Resultados com nome, métrica e dono"
            description="Histórias de PMEs que escalaram com tecnologia e IA — com os números que mudaram."
          />
          <div className="mt-12">
            <Link to={i18n.language === 'pt' ? '/casos-de-sucesso' : `/${i18n.language}/casos-de-sucesso`} className="group block">
              <div className="gb-surface-card transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-tint text-brand-600">
                  <Trophy className="h-5 w-5" />
                </span>
                <h3 className="gb-text-h3 mt-5 text-ink-primary">Ver todos os casos de sucesso</h3>
                <p className="gb-text-body mt-3 max-w-2xl text-ink-secondary">
                  Contexto, solução, execução e resultado — escrito para que
                  saibas exactamente o que esperar de uma parceria connosco.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                  Ler casos <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================== PROOF */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Os números que sustentam o portefólio"
            description="Métricas médias de projectos em produção — com origem rastreada."
          />
          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {proof.map((p, i) => (
              <motion.div
                key={p.k}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="gb-surface-card-elevated"
              >
                <div className="gb-text-h2 text-brand-600">{p.k}</div>
                <p className="gb-text-small mt-2 text-ink-secondary">{p.v}</p>
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
                O teu projecto pode ser o{' '}
                <span style={{ color: ACCENT }}>próximo caso</span>.
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Conta-nos o contexto e os objectivos — voltamos com um plano
                concreto em menos de 48 horas.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`}>
                    Falar com um consultor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                  <Link to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`}>
                    Agendar reunião <ArrowRight className="h-4 w-4" />
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

export default Work;
