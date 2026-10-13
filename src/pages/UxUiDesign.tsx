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
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { ScrollDepth } from '@/components/ScrollDepth';
import { analytics } from '@/lib/analytics';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

const manifestoLines = ['Design não é decoração.', 'É a tua taxa de conversão.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Discovery e Research',
    title: 'Decisões guiadas por evidência, não por gosto',
    tags: ['Entrevistas', 'Jobs-to-be-Done', 'Heurísticas', 'Análise de Funil'],
    body: 'Antes de desenhar um pixel, mapeamos utilizadores reais, objectivos de negócio e pontos de fricção actuais. Combinamos entrevistas qualitativas com dados de analytics e heatmaps para encontrar onde a experiência está a queimar receita — e onde uma pequena mudança destranca crescimento.',
  },
  {
    eyebrow: 'Arquitectura de Informação',
    title: 'Fluxos que reduzem cliques e dúvidas',
    tags: ['User Flows', 'Card Sorting', 'Wireframes', 'Priorização'],
    body: 'Estruturamos navegação, hierarquia e microcopy para que cada ecrã tenha uma acção óbvia. Menos passos, menos campos, menos abandono. O utilizador chega ao objectivo sem precisar de manual e a equipa comercial recebe leads mais qualificados.',
  },
  {
    eyebrow: 'UI Design e Sistemas',
    title: 'Interfaces coerentes que escalam com o produto',
    tags: ['Design Tokens', 'Figma Libraries', 'Componentização', 'Acessibilidade AA'],
    body: 'Entregamos um design system versionado — não mockups soltos. Tipografia, cor, espaçamento e componentes vivem em tokens sincronizados com o código. Novas features nascem em horas com consistência de marca e acessibilidade WCAG AA garantida.',
  },
  {
    eyebrow: 'Prototipagem e Validação',
    title: 'Testar antes de programar poupa meses',
    tags: ['Protótipos Figma', 'Testes Moderados', 'A/B em produção', 'Iteração Semanal'],
    body: 'Validamos protótipos interactivos com 5 a 8 utilizadores reais antes de escrever uma linha de código. Ajustamos fluxos com base em fricção observada, não em opinião de comité. Depois medimos em produção com A/B testing e ciclos curtos de melhoria.',
  },
  {
    eyebrow: 'Handoff e Design Ops',
    title: 'Design que chega ao código sem se perder',
    tags: ['Figma → Código', 'Storybook', 'Design Reviews', 'Documentação viva'],
    body: 'Trabalhamos lado a lado com engenharia: specs técnicas, motion guidelines, estados de erro e responsivo documentados. Um Storybook publicado mantém design e código alinhados à medida que o produto evolui — chega de "isto não ficou como no Figma".',
  },
];

const SOFTWARE = PILLARS.software;

const UxUiDesign = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="uxui" />
      <SEO
        title="UX/UI Design — Interfaces que Convertem e Escalam | Getboost Digital"
        description="Design de experiência e interface centrado em investigação, sistemas escaláveis e validação com utilizadores reais. Menos fricção, mais conversão."
        canonical="/solucoes/ux-ui-design"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(255,255,255,0) 65%)',
          }}
        />

        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="gb-eyebrow text-brand-600"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            UX Research · UI Systems · Prototipagem · Acessibilidade
          </motion.div>

          <h1 className="gb-text-display mt-5 text-ink-primary">
            {manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === manifestoLines.length - 1 ? (
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>
                    {line}
                  </span>
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
            Desenhamos produtos digitais que <em className="not-italic text-ink-primary">as pessoas percebem à primeira</em>.
            Investigação com utilizadores reais, sistemas de design versionados e validação
            contínua — para reduzir fricção, aumentar conversão e escalar sem perder coerência.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => analytics.trackClick('uxui_hero', 'uxui_contact', 'consideration')}>
              Pedir Proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria UX 7 min
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '-38%', v: 'Fricção no checkout' },
              { k: '+62%', v: 'Conclusão de onboarding' },
              { k: 'AA', v: 'Acessibilidade WCAG' },
              { k: '5x', v: 'Velocidade de novas features' },
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

      {/* FEATURES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Evidência, fluxos e sistemas que escalam"
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
                steps={['Discovery e Research', 'Arquitectura de Informação', 'UI Design e Sistemas', 'Prototipagem e Validação', 'Handoff e Design Ops']}
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
            {PRODUCTS.filter((product) => product.slug === 'pikto').map((product) => (
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

<section className="gb-surface-page gb-section">
        <div className="gb-container"><div className="gb-cta-band relative overflow-hidden border border-white/10 text-center"><div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse"
          >
            Pronto para <span style={{ color: ACCENT }}>desenhar</span> uma experiência que{' '}
            <span style={{ color: ACCENT }}>converte</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um designer'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'ux-ui-design',
              name: 'UX/UI Design',
              accent: ACCENT,
              eyebrow: 'Briefing · UX/UI Design',
              headline: 'Vamos redesenhar a tua experiência.',
              subhead: 'Conta-nos o produto, o público e onde estás a perder utilizadores. Devolvemos um plano de discovery, wireframes e sistema de design com prazos e investimento.',
              goalOptions: [
                'Redesenhar produto ou app existente',
                'Criar design system do zero',
                'Melhorar taxas de conversão',
                'Auditoria de usabilidade e acessibilidade',
                'Ainda a explorar',
              ],
              messagePlaceholder: 'Produto, stack, métricas actuais, principais pontos de fricção…',
            }}
          />
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default UxUiDesign;
