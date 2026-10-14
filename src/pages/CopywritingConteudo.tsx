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

const manifestoLines = ['Palavras que', 'trabalham por ti.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Escrita que Converte',
    title: 'Copy Persuasiva com Foco em Vendas',
    tags: ['Headlines Magnéticas', 'CTAs Testados', 'Storytelling', 'Framework AIDA/PAS'],
    body: 'Cada frase tem uma missão: prender atenção, criar desejo e levar à acção. Trabalhamos títulos, subtítulos e chamadas para acção como se fossem alavancas comerciais — porque é exactamente isso que são. Nada é acidental, tudo é medido.',
  },
  {
    eyebrow: 'Conteúdo com Autoridade',
    title: 'Artigos e Blog Posts que Posicionam a Marca',
    tags: ['Long-form SEO', 'Pesquisa Original', 'Tone of Voice', 'Cluster de Tópicos'],
    body: 'Escrevemos peças de fundo que Google adora e leitores partilham. Investigamos o teu sector, cruzamos dados e devolvemos artigos que constroem reputação técnica, geram tráfego orgânico consistente e sustentam a estratégia de conteúdo a médio/longo prazo.',
  },
  {
    eyebrow: 'Estratégia Editorial',
    title: 'Calendário e Governance de Conteúdo',
    tags: ['Content Calendar', 'Buyer Journey', 'Repurposing', 'KPIs Editoriais'],
    body: 'Antes de escrever, planeamos. Mapeamos personas, jornada de compra e formatos por canal. Cada peça encaixa num sistema — artigo alimenta newsletter, newsletter alimenta social, social alimenta funil. Menos disperso, mais composto.',
  },
  {
    eyebrow: 'Multicanal Nativo',
    title: 'Redes Sociais, Email e Notificações',
    tags: ['Posts Sociais', 'Sequências de Email', 'Push & SMS', 'Micro-copy UX'],
    body: 'Um único tom de voz consistente em todos os pontos de contacto. Copy para Instagram, LinkedIn, newsletters, onboarding no produto e notificações — sempre com a mesma personalidade, adaptado ao formato e à intenção de cada canal.',
  },
  {
    eyebrow: 'Otimização Contínua',
    title: 'A/B Testing, Analytics e Iteração',
    tags: ['Testes A/B', 'Análise de Métricas', 'Reescrita Data-Driven', 'CRO Copy'],
    body: 'Publicar não é o fim, é o início. Medimos leitura, cliques, scroll e conversão. Reescrevemos o que não performa, escalamos o que funciona. Copy é activo vivo — tratamos assim.',
  },
  {
    eyebrow: 'IA + Curadoria Humana',
    title: 'Produção Acelerada sem Perder Alma',
    tags: ['Assistentes de Escrita', 'Guidelines de Marca', 'Revisão Editorial', 'Anti-genérico'],
    body: 'Usamos IA para acelerar pesquisa, estruturas e rascunhos. Mas cada peça passa por editores humanos que garantem voz, precisão e originalidade. Zero conteúdo "cheira a IA" — sempre com o teu ADN.',
  },
];

const pillars = [
  {
    n: '01',
    t: 'Transformar palavras em receita',
    d: 'Textos otimizados e persuasivos que convertem visitantes em leads qualificadas e leads em clientes recorrentes.',
  },
  {
    n: '02',
    t: 'Conquistar notoriedade orgânica',
    d: 'Conteúdo bem escrito e estruturado sobe nos motores de busca, amplia visibilidade e reforça credibilidade.',
  },
  {
    n: '03',
    t: 'Aproximar e fidelizar audiência',
    d: 'Copy com propósito cria vínculo emocional, transforma leitores em fãs e fãs em embaixadores da marca.',
  },
];

const process = [
  { t: 'Pesquisa', d: 'Estudamos audiência, concorrência e keywords antes de escrever a primeira palavra.' },
  { t: 'Objetivo', d: 'Cada texto tem um KPI claro — leitura, clique, lead, venda ou retenção.' },
  { t: 'Exclusividade', d: 'Conteúdo original, sem duplicações, com pontos de vista únicos ao teu negócio.' },
  { t: 'Tom de Voz', d: 'Guidelines editoriais que garantem consistência em todas as peças e canais.' },
  { t: 'Análise', d: 'Medimos performance real: tempo em página, scroll, cliques e conversão.' },
  { t: 'Otimização', d: 'Iteramos com base em dados. SEO técnico, reescrita e expansão dos vencedores.' },
];

const GROWTH = PILLARS.growth;

const CopywritingConteudo = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="copywriting" />
      <SEO
        title="Copywriting & Conteúdo — Palavras que Convertem | Getboost Digital"
        description="Copywriting persuasivo e estratégia de conteúdo que transforma leitores em clientes. SEO, storytelling e produção multicanal com curadoria editorial."
        canonical="/solucoes/copywriting-conteudo"
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
            Copywriting · Content Strategy · SEO Editorial
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
            Grandes produtos morrem por má comunicação. Escrevemos copy que capta, persuade e
            converte — combinando pesquisa profunda, SEO técnico e storytelling afinado ao ADN
            da tua marca. Cada palavra tem trabalho a fazer.
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
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => analytics.trackClick('copywriting_hero', 'copywriting_contact', 'consideration')}>
              Pedir Proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria de conteúdo 7 min
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '+3x', v: 'Leitura média por artigo' },
              { k: '+180%', v: 'Tráfego orgânico 6M' },
              { k: '<48h', v: 'Prazo por peça standard' },
              { k: '100%', v: 'Original, zero plágio' },
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

      {/* PILARES 01/02/03 */}
      <section className="gb-surface-section gb-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-16 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="absolute -top-6 -left-2 font-black text-[7rem] leading-none text-ink-primary/[0.07] select-none">
                {p.n}
              </div>
              <div className="relative">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight">{p.t}</h3>
                <p className="mt-4 text-sm md:text-base text-ink-secondary leading-relaxed">{p.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURE LIST — accordion */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Copy que vende, conteúdo que posiciona"
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

      {/* PROCESSO — 6 passos */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,5vw,4.5rem)] max-w-4xl"
          >
            Como fazemos <span style={{ color: ACCENT }}>copy que rende</span>.
          </motion.h2>

          <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {process.map((p, i) => (
              <motion.div
                key={p.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative"
              >
                <div className="absolute -top-4 -left-1 font-black text-[5rem] leading-none text-white/[0.05] select-none">
                  0{i + 1}
                </div>
                <div className="relative">
                  <h4 className="text-lg font-bold" style={{ color: ACCENT }}>{p.t}</h4>
                  <p className="mt-3 text-sm text-ink-secondary leading-relaxed">{p.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
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
            Pronto para escrever{' '}
            <span style={{ color: ACCENT }}>menos</span> e vender{' '}
            <span style={{ color: ACCENT }}>mais</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um editor'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'copywriting-conteudo',
              name: 'Copywriting & Conteúdo',
              accent: ACCENT,
              eyebrow: 'Briefing · Copywriting',
              headline: 'Vamos afinar a voz da tua marca.',
              subhead: 'Diz-nos o que precisas de escrever, para quem e com que objectivo. Devolvemos um plano editorial concreto com prazos e KPIs.',
              goalOptions: [
                'Copy de website e landing pages',
                'Artigos SEO e blog',
                'Newsletters e email marketing',
                'Conteúdo para redes sociais',
                'Estratégia editorial completa',
              ],
              messagePlaceholder: 'Volume mensal desejado, canais, temas, tom de voz, referências que gostas…',
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

export default CopywritingConteudo;
