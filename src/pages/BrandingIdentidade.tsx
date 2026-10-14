import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Check, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PRODUCTS } from '@/data/products';
import { PILLARS } from '@/components/pillars/pillarData';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CountUp } from '@/components/ui/count-up';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { ScrollDepth } from '@/components/ScrollDepth';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { analytics } from '@/lib/analytics';
import { Reveal } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

const manifestoLines = ['Visão vira presença.', 'Presença vira memória.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'A personalidade de cada marca',
    title: 'Identidade Visual com propósito',
    tags: ['Paleta Cromática', 'Sistema Tipográfico', 'ADN da Marca', 'Direcção de Arte'],
    body: 'Uma identidade visual não se decora — constrói-se. Investigamos território, cultura e concorrência para chegar a um sistema visual que comunica os valores da marca mesmo quando o logótipo não está presente. Consistência que vira reconhecimento.',
  },
  {
    eyebrow: 'O logo é a chave',
    title: 'Design de Logótipo & Iconografia',
    tags: ['Símbolo', 'Logotipo', 'Iconografia', 'Variações Responsivas'],
    body: 'Desenhamos marcas claras, distintas e inconfundíveis. Um logótipo tem de funcionar num favicon e numa fachada, num Reels e num contrato. Testamos em cada aplicação real antes de entregar — porque o design que sobrevive é o design que se usa.',
  },
  {
    eyebrow: 'Posicionamento que se lê',
    title: 'Naming & Verbal Identity',
    tags: ['Verificação de Domínio', 'Fonética', 'Semântica', 'Memorabilidade', 'Tagline'],
    body: 'A partir do nome, a marca ganha sentido. Criamos naming disponível, fonético, com força semântica e verificação legal e de domínio. Acrescentamos tom de voz e vocabulário próprio para que cada texto soe inequivocamente da marca.',
  },
  {
    eyebrow: 'Consistência, clareza e rigor',
    title: 'Manual de Normas & Brand Book',
    tags: ['Brandbook', 'Guidelines', 'Aplicações', 'Design Tokens', 'Assets Kit'],
    body: 'Entregamos um manual vivo, com regras claras para cores, tipografia, grelhas, iconografia, fotografia e tom de voz. Inclui design tokens prontos para Figma e código — a mesma identidade funciona em papel, ecrã, produto e conteúdo social.',
  },
  {
    eyebrow: 'Marca em movimento',
    title: 'Motion Brand & Aplicações Digitais',
    tags: ['Logo Animation', 'Motion Guidelines', 'Templates Sociais', 'Presentation Kit'],
    body: 'A marca não é estática. Definimos como respira, como se move e como aparece em vídeo, redes sociais, apresentações e produto. Deixamos templates prontos para a equipa manter consistência sem depender de agência para cada peça.',
  },
  {
    eyebrow: 'Rebrand & Evolução',
    title: 'Rebranding com Continuidade Estratégica',
    tags: ['Auditoria de Marca', 'Roadmap de Migração', 'Comunicação Interna', 'Rollout Multi-canal'],
    body: 'Um rebrand não é começar do zero — é evoluir sem perder equity. Auditamos o que já existe, identificamos o que preservar e desenhamos um roadmap de rollout coordenado entre marketing, produto, retail e comunicação interna.',
  },
];

const GROWTH = PILLARS.growth;

const BrandingIdentidade = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="branding" />
      <SEO
        title="Branding & Identidade Visual — Naming, Logo & Brand System | Getboost Digital"
        description="Criamos marcas que ficam na memória. Identidade visual, naming, logótipo, manual de normas e motion brand pensados para gerar reconhecimento e autoridade."
        canonical="/solucoes/branding-identidade"
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
            Identidade · Logótipo · Naming · Brand System
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
            Uma marca forte não é um logótipo bonito. É um <em className="not-italic text-ink-primary">sistema
            coerente</em> de decisões visuais, verbais e comportamentais que fazem com que o teu público
            te reconheça no meio do ruído — e te escolha.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir Proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Ver portfólio
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '30+', v: 'Projetos entregues' },
              { k: '3–6 sem', v: 'Sprint de identidade' },
              { k: '100%', v: 'Custom, zero template' },
              { k: '360°', v: 'Off + on + produto' },
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
            title="Identidade completa, do logótipo ao brand book"
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

      {/* PROCESSO */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start border-t border-ink-primary/10 pt-16">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Processo
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                Sprint estruturado em 4 fases.
              </h2>
              <p className="mt-6 text-ink-secondary leading-relaxed">
                Um método claro para chegar a uma marca com significado e continuidade, sem
                surpresas nem entregas genéricas.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { n: '01', t: 'Descoberta', d: 'Entrevistas, benchmarking cultural e território de marca.' },
                { n: '02', t: 'Estratégia', d: 'Posicionamento, arquitectura, brand promise e tom de voz.' },
                { n: '03', t: 'Design', d: 'Sistema visual, logótipo, tipografia, paleta e aplicações.' },
                { n: '04', t: 'Rollout', d: 'Manual de normas, templates, activação e handover à equipa.' },
              ].map((s) => (
                <div key={s.n} className="border border-ink-primary/15 p-6 hover:border-brand-600/50 transition-colors">
                  <div className="flex items-center gap-5">
                    <span className="font-mono text-sm" style={{ color: ACCENT }}>{s.n}</span>
                    <h3 className="text-xl md:text-2xl font-bold">{s.t}</h3>
                  </div>
                  <p className="mt-3 text-ink-secondary text-sm md:text-base">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ENTREGAS */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-ink-primary/10 pt-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            O que entregamos
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            Um kit completo, pronto para viver em qualquer canal.
          </h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Logótipo & variações',
              'Paleta cromática',
              'Sistema tipográfico',
              'Iconografia custom',
              'Grelhas & layouts',
              'Direcção fotográfica',
              'Tom de voz & copy',
              'Motion & animações',
              'Templates sociais',
              'Presentation deck',
              'Assets kit (Figma + PNG/SVG)',
              'Manual de normas PDF',
            ].map((item) => (
              <div key={item} className="border border-ink-primary/15 px-5 py-4 text-sm text-ink-primary hover:border-[color:var(--accent)] transition-colors"
                style={{ ['--accent' as string]: ACCENT }}>
                {item}
              </div>
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
            Pronto para transformar a tua{' '}
            <span style={{ color: ACCENT }}>marca</span> numa{' '}
            <span style={{ color: ACCENT }}>referência</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Trabalhar connosco'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'branding-identidade',
              name: 'Branding & Identidade Visual',
              accent: ACCENT,
              eyebrow: 'Briefing · Branding',
              headline: 'Vamos desenhar a tua marca.',
              subhead: 'Conta-nos o momento da tua marca. Preparamos uma proposta de identidade — nova, evolução ou sistema completo — adaptada ao teu contexto e prazos.',
              goalOptions: [
                'Criar marca do zero',
                'Rebranding / evolução',
                'Naming & verbal identity',
                'Manual de normas & brand book',
                'Motion brand & templates',
                'Auditoria de marca actual',
              ],
              messagePlaceholder: 'Setor, público-alvo, referências que gostas, o que já existe (se aplicável), prazos ideais…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default BrandingIdentidade;
