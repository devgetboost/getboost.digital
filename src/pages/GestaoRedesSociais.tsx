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
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { Reveal } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

const manifestoLines = ['Não fazemos posts.', 'Construímos audiência.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Estratégia & Posicionamento',
    title: 'Narrativa de marca com propósito',
    tags: ['Brand Voice', 'Pilares de Conteúdo', 'Calendário Editorial', 'Análise de Público'],
    body: 'Antes de publicar, definimos o território que a tua marca vai ocupar. Desenhamos uma linha editorial coerente, alinhada com os teus objectivos comerciais, para que cada peça reforce autoridade e não seja apenas mais um post no feed.',
  },
  {
    eyebrow: 'Produção Criativa',
    title: 'Conteúdo pensado para parar o scroll',
    tags: ['Reels & TikTok', 'Carrosséis Editoriais', 'Motion & Design', 'Copy Persuasivo'],
    body: 'Da captação em estúdio à edição final: produzimos Reels, TikToks, carrosséis e motion graphics com direcção de arte própria. Cada formato é adaptado à plataforma para maximizar retenção, partilhas e conversas.',
  },
  {
    eyebrow: 'Paid Social & Performance',
    title: 'Meta, TikTok e LinkedIn com foco em ROI',
    tags: ['Meta Ads', 'TikTok Ads', 'LinkedIn Ads', 'Retargeting Full-funnel'],
    body: 'Amplificamos o que já funciona no orgânico com campanhas segmentadas. Estruturamos funis completos, testamos criativos em paralelo e optimizamos CPA e ROAS semana a semana — sem queimar budget em audiências que não convertem.',
  },
  {
    eyebrow: 'Community & Social Care',
    title: 'Conversas que criam lealdade',
    tags: ['Gestão de DMs', 'Moderação', 'Escuta Activa', 'Playbook de Crises'],
    body: 'Redes sociais são canais de duas vias. Respondemos comentários e mensagens com tom coerente, transformamos dúvidas em oportunidades comerciais e blindamos a marca com um protocolo claro para momentos sensíveis.',
  },
  {
    eyebrow: 'Analytics & Growth',
    title: 'Decisões baseadas em dados, não em suposições',
    tags: ['Dashboards Real-time', 'KPIs Comerciais', 'Benchmarking', 'Relatórios Mensais'],
    body: 'Analisamos alcance, engagement, saved posts, CTR e conversão em dashboards claros. Cruzamos dados sociais com o funil de vendas para mostrar o impacto real das redes no negócio — e ajustar a estratégia em tempo real.',
  },
];

const GROWTH = PILLARS.growth;

const GestaoRedesSociais = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="redes" />
      <SEO
        title="Gestão de Redes Sociais — Estratégia, Conteúdo & Paid Social | Getboost Digital"
        description="Transformamos seguidores em clientes. Estratégia editorial, produção criativa, paid social e community management pensados para gerar vendas e autoridade."
        canonical="/solucoes/gestao-redes-sociais"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(255,255,255,0) 65%)',
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
            Estratégia · Conteúdo · Paid · Comunidade
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
            Uma marca forte não vive de sorte algorítmica. Vive de uma
            <em className="not-italic text-ink-primary"> estratégia editorial</em> consistente,
            de criatividade que corta ruído e de dados que fecham o ciclo entre atenção e receita.
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
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => analytics.trackClick('redes_hero', 'redes_contact', 'consideration')}>
              Pedir Proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Ver casos reais
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '+340%', v: 'Alcance orgânico médio' },
              { k: '5x', v: 'Engagement vs. baseline' },
              { k: '<48h', v: 'Resposta em DMs' },
              { k: '4.2', v: 'ROAS médio em paid' },
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

      {/* FEATURE LIST */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Conteúdo que para o scroll e cria lealdade"
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

      {/* PLATAFORMAS */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start border-t border-white/10 pt-16">
            <div>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Ecossistema
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                Uma marca, todos os canais.
              </h2>
              <p className="mt-6 text-white/70 leading-relaxed">
                Coordenamos presença em Instagram, TikTok, LinkedIn, Facebook, Pinterest e YouTube
                Shorts. Cada canal com estratégia própria, mas alinhado numa mesma identidade.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Instagram', 'TikTok', 'LinkedIn',
                'Facebook', 'Pinterest', 'YouTube Shorts',
                'Threads', 'X / Twitter', 'Google Business',
              ].map((p) => (
                <div
                  key={p}
                  className="border border-white/15 px-5 py-4 text-sm font-mono uppercase tracking-widest text-white/80 hover:border-[color:var(--accent)] transition-colors"
                  style={{ ['--accent' as string]: ACCENT }}
                >
                  {p}
                </div>
              ))}
            </div>
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
                steps={['Estratégia & Posicionamento', 'Produção Criativa', 'Paid Social & Performance', 'Community & Social Care', 'Analytics & Growth']}
                tint="var(--gb-growth-tint)"
                strong="var(--gb-growth-strong)"
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
            {GROWTH.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-growth-strong)' }}><CountUp value={p.k} /></div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
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
            {PRODUCTS.filter((product) => product.slug === 'trackfy').map((product) => (
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
            Pronto para transformar seguidores em{' '}
            <span style={{ color: ACCENT }}>clientes</span> e presença em{' '}
            <span style={{ color: ACCENT }}>autoridade</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um estratega'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'gestao-redes-sociais',
              name: 'Gestão de Redes Sociais',
              accent: ACCENT,
              eyebrow: 'Briefing · Redes Sociais',
              headline: 'Vamos desenhar a tua presença digital.',
              subhead: 'Conta-nos o momento actual da tua marca e o que queres atingir. Preparamos uma estratégia editorial e de paid social adaptada ao teu negócio.',
              goalOptions: [
                'Crescer audiência e notoriedade',
                'Gerar leads / vendas directas',
                'Reforçar autoridade e posicionamento',
                'Reactivar contas paradas',
                'Lançar novo produto ou marca',
              ],
              messagePlaceholder: 'Redes actuais, número de seguidores, quem produz conteúdo hoje, tom de comunicação…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default GestaoRedesSociais;
