import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Check, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import { CountUp } from '@/components/ui/count-up';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CaseProofStrip } from '@/components/CaseProofStrip';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { ScrollDepth } from '@/components/ScrollDepth';
import { analytics } from '@/lib/analytics';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { Reveal } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

const manifestoLines = ['Menos ferramentas.', 'Mais resultados.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Pessoal & Empresa',
    title: 'Gestão de Pessoas e Operação Central',
    tags: ['Colaboradores', 'Assiduidade', 'Documentos', 'Fluxos Internos'],
    body: 'Centraliza o ciclo de vida do colaborador — contratos, documentos, ausências, ponto e organização de equipas. A operação da empresa deixa de viver espalhada por folhas de cálculo e passa a correr num sistema único, auditável e sincronizado.',
  },
  {
    eyebrow: 'Formação & Engagement',
    title: 'Cultura, Formações e Envolvimento',
    tags: ['Academia Interna', 'Gamificação', 'Comunicação', 'Cultura'],
    body: 'Cria trilhos de formação, distribui conhecimento e mede envolvimento com mecânicas de gamificação. Equipas mais formadas, mais alinhadas e com uma cultura viva, medida por dados — não por percepção.',
  },
  {
    eyebrow: 'Talento & Recrutamento',
    title: 'Atração, Selecção e Retenção de Talento',
    tags: ['Pipeline de Candidatos', 'Avaliações', 'Performance', 'Planos de Carreira'],
    body: 'Do primeiro contacto com o candidato até à avaliação de desempenho contínua. O Pikto liga recrutamento, onboarding e evolução de carreira num único fluxo, para que o talento certo entre — e cresça — dentro da empresa.',
  },
  {
    eyebrow: 'Finanças & Despesas',
    title: 'Controlo Financeiro com OCR e Aprovações',
    tags: ['OCR Documentos', 'Aprovações', 'Reembolsos', 'Pagamentos'],
    body: 'Despesas capturadas por OCR, fluxos de aprovação configuráveis e integração com pagamentos. A gestão financeira operacional acontece em tempo real, sem perder recibos, sem atrasos e sem chamadas para "onde está aquela fatura?".',
  },
  {
    eyebrow: 'Automação & Inteligência',
    title: 'Dashboards, Automações e Decisão',
    tags: ['Workflows', 'Relatórios', 'Licenças SaaS', 'Ambiente Isolado'],
    body: 'Automatiza tarefas repetitivas, monitoriza licenças de software, gera relatórios executivos e transforma dados em decisões. Cada cliente opera num ambiente exclusivo, com dados isolados, segurança reforçada e upgrade imediato quando o negócio cresce.',
  },
];

const SOFTWARE = PILLARS.software;

export default function PiktoLanding() {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="pikto" />
      <SEO
        title="Pikto — SaaS de Gestão Empresarial | Getboost Digital"
        description="Uma plataforma SaaS que conecta pessoas, processos e resultados. Gestão, formação, recrutamento e finanças num único sistema escalável e seguro."
        canonical="/pikto"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(250,247,241,0) 65%)',
          }}
        />

        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="gb-eyebrow text-brand-600"
            style={{ borderColor: `${ACCENT}66` }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            SaaS · Modular · Multi-tenant · Seguro
          </motion.div>

          <h1 className="ed-display mt-6 text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]">
            {manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === manifestoLines.length - 1 ? (
                  <em>
                    {line.endsWith('.') ? line.slice(0, -1) : line}
                    <span style={{ color: ACCENT }}>.</span>
                  </em>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 h-px w-40 origin-left"
            style={{ background: `${ACCENT}b3` }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="gb-text-body mt-6 max-w-xl text-ink-secondary"
          >
            Não é mais um <em className="not-italic text-ink-primary">software de gestão</em>. É o sistema
            operativo do teu negócio — pessoas, processos, formação, recrutamento e finanças a
            trabalhar sincronizados, num só ambiente exclusivo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/demo?produto=pikto"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => analytics.trackClick('pikto_hero', 'pikto_demo', 'consideration')}>
              Pedir Demonstração
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary" onClick={() => analytics.trackClick('pikto_cta', 'pikto_contact', 'consideration')}>
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Falar com um consultor
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '7', v: 'Módulos integrados' },
              { k: '1', v: 'Ambiente por cliente' },
              { k: '0', v: 'Ferramentas dispersas' },
              { k: '∞', v: 'Planos escaláveis' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink-tertiary">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES ACCORDION */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Pessoas, processos e resultados num só sistema"
            description="Abre cada bloco para ver o que está incluído e como se liga ao resto da operação."
          />
          <div className="border-t border-black/[0.06]">
            {features.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={f.title} className="border-b border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-black/[0.02]"
                  >
                    <div>
                      <div className="flex items-start gap-5">
                        <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'var(--gb-ink-tertiary)' }}>
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                        </span>
                        <h3 className="gb-text-h3 !text-3xl md:!text-4xl text-ink-primary">
                          {f.title}
                        </h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-10 flex flex-wrap gap-3">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="gb-chip"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-6">
                        <span
                          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em]"
                          style={{ color: isOpen ? ACCENT : 'var(--gb-ink-tertiary)' }}
                        >
                          {f.eyebrow}
                        </span>
                        <Minus
                          className="h-6 w-6 shrink-0 transition-transform"
                          style={{
                            color: isOpen ? ACCENT : 'var(--gb-ink-tertiary)',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                          }}
                        />
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden text-sm md:text-base leading-relaxed text-ink-secondary"
                          >
                            {f.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VALUE STATEMENT */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="border-l-2 pl-8 md:pl-12" style={{ borderColor: ACCENT }}>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--gb-brand-600)' }}>
              Proposta de valor
            </span>
            <p className="mt-6 text-2xl md:text-4xl font-bold leading-[1.15] tracking-tight">
              Mais do que software, a Pikto transforma <span style={{ color: ACCENT }}>caos em clareza</span>,
              processos em produtividade e equipas em <span style={{ color: ACCENT }}>alta performance</span>.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
            {/* COMO FUNCIONA */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como funciona"
            title="Da entrada ao resultado, sem fricção"
            description="Cada etapa alimenta a seguinte — do primeiro contacto à operação em contínuo."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Pessoal & Empresa', 'Formação & Engagement', 'Talento & Recrutamento', 'Finanças & Despesas', 'Automação & Inteligência']}
                tint="var(--gb-software-tint)"
                strong="var(--gb-software-strong)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROVA */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="A mesma engenharia, noutros produtos"
            description="Construímos e operamos os nossos próprios produtos com o mesmo rigor que aplicamos nos clientes."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SOFTWARE.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-software-strong)' }}><CountUp value={p.k} /></div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PRODUCTS.filter((product) => product.slug === 'qook').map((product) => (
              <Reveal key={product.slug} i={0}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'proof_crosslink')}>
                  <div className="gb-surface-card gb-card-lift h-full">
                    <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                    <h3 className="gb-text-h3 mt-4 text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                    <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Conhecer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
            {PRODUCTS.filter((product) => product.slug === 'motivae').map((product) => (
              <Reveal key={product.slug} i={0}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'proof_crosslink')}>
                  <div className="gb-surface-card gb-card-lift h-full">
                    <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                    <h3 className="gb-text-h3 mt-4 text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                    <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Conhecer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild variant="ghost">
              <Link to="/produtos">
                Ver todos os produtos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 10B CASOS — resultados de clientes (motor partilhado, sem conteúdo inventado) */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <CaseProofStrip
            slugs={['pikto']}
            tint="var(--gb-software-tint)"
            strong="var(--gb-software-strong)"
            trackingLocation="pikto_cases"
          />
        </div>
      </section>

<section className="gb-surface-page gb-section">
        <div className="gb-container"><div className="gb-cta-band relative overflow-hidden border border-white/10 text-center"><div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse"
          >
            Pronto para <span style={{ color: ACCENT }}>crescer</span> com{' '}
            <span style={{ color: ACCENT }}>organização</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {contactOpen ? 'Fechar formulário' : 'Pedir demonstração'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'pikto',
              name: 'Pikto SaaS',
              accent: ACCENT,
              eyebrow: 'Briefing · Pikto',
              headline: 'Vamos configurar o Pikto para o teu negócio.',
              subhead: 'Diz-nos a dimensão da tua equipa e quais os módulos que fazem sentido activar primeiro. Preparamos uma demonstração personalizada.',
              goalOptions: [
                'Centralizar gestão de pessoas',
                'Controlar assiduidade e ponto',
                'Automatizar despesas e aprovações',
                'Formação e engagement interno',
                'Recrutamento e performance',
                'Ainda a explorar',
              ],
              messagePlaceholder: 'Número de colaboradores, módulos de interesse, sistemas actuais que queres substituir…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
}
