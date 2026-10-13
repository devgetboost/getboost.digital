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

const manifestoLines = ['SEO, GEO', '& WebMCP.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Estratégia e hierarquização',
    title: 'SEO Tradicional: a base de tudo',
    tags: ['Pesquisa de Keywords', 'Otimização On-Page', 'Arquitetura de Informação', 'SEO Local'],
    body: 'A fundação continua a ser inegociável. Trabalhamos SEO técnico e semântico em profundidade, mapeamos intenções de pesquisa por cluster, redesenhamos a arquitectura de informação e garantimos que cada página tem um papel claro no funil de descoberta. Rankings sustentáveis nascem de estrutura, não de truques.',
  },
  {
    eyebrow: 'Indexação para o novo mundo de IA',
    title: 'WebMCP & GEO — Generative Engine Optimization',
    tags: ['Protocolo WebMCP', 'AI Search Optimization', 'LLM Compatibility', 'Busca Generativa (SGE)'],
    body: 'A pesquisa mudou. ChatGPT, Gemini, Claude, Perplexity e o Google SGE lêem, resumem e citam conteúdo de forma diferente dos crawlers clássicos. Implementamos o novo protocolo WebMCP, estruturamos conteúdo para ser interpretável por LLMs e garantimos que a tua marca aparece nas respostas geradas — não apenas nos 10 links azuis.',
  },
  {
    eyebrow: 'Implementação técnica',
    title: 'SEO Técnico & Performance',
    tags: ['Core Web Vitals', 'Velocidade de Carga', 'Mobile-First Indexing', 'Schema Markup Avançado'],
    body: 'Sites lentos não indexam e não convertem. Optimizamos infra, rendering, imagens, JS crítico e schema estruturado para que Google, ChatGPT e Gemini consigam ler qualquer página em milissegundos. Cada melhoria técnica é validada com métricas reais — não com relatórios que ninguém age.',
  },
  {
    eyebrow: 'Conteúdo inteligente',
    title: 'Estratégia de Conteúdo E-E-A-T',
    tags: ['Experiência', 'Especialidade', 'Autoridade', 'Confiança', 'Topic Clusters'],
    body: 'Criamos conteúdo ancorado no framework E-E-A-T do Google e nas heurísticas de citação das LLMs. Cada peça é planeada para responder a uma intenção específica, com profundidade real, dados próprios e formatação que facilita a extracção por motores de busca e modelos generativos.',
  },
  {
    eyebrow: 'Notoriedade e reputação',
    title: 'Autoridade & Link Building',
    tags: ['Digital PR', 'Backlink Audit', 'Brand Mentions', 'Entity SEO'],
    body: 'Autoridade constrói-se com menções, não apenas com links. Combinamos digital PR, guest posting relevante, auditoria de backlinks tóxicos e trabalho de entidade (Knowledge Graph, Wikidata) para consolidar a tua marca como referência aos olhos do Google e das LLMs.',
  },
  {
    eyebrow: 'Ver o que os outros não vêem',
    title: 'AI Search Analytics & Tracking',
    tags: ['LLM Rank Tracking', 'Share of Voice', 'Prompt Monitoring', 'Citation Analysis'],
    body: 'Não basta medir posições no Google. Monitorizamos citações no ChatGPT, Perplexity, Gemini e Copilot, mapeamos os prompts onde a tua marca aparece (ou devia aparecer) e reportamos share of voice generativo — o novo KPI da visibilidade digital.',
  },
  {
    eyebrow: 'Internacionalização',
    title: 'SEO Multilingue & Multi-mercado',
    tags: ['Hreflang', 'ccTLD Strategy', 'Local Intent', 'Cultural Adaptation'],
    body: 'Traduzir não é fazer SEO. Adaptamos intenções de pesquisa por país, resolvemos hreflang, estruturamos domínios/subpastas e produzimos conteúdo culturalmente calibrado para cada mercado — porque as LLMs também respondem em local, não em global.',
  },
];

const GROWTH = PILLARS.growth;

const SeoGeoWebmcp = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="seo_geo" />
      <SEO
        title="SEO, GEO & WebMCP — Visibilidade em Google e LLMs | Getboost Digital"
        description="SEO tradicional, Generative Engine Optimization e protocolo WebMCP para garantir que a tua marca aparece no Google, ChatGPT, Gemini, Claude e Perplexity."
        canonical="/solucoes/seo-geo-webmcp"
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
            SEO 2.0 · WebMCP · AI Ready
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
            O Google mudou. E a forma como as pessoas descobrem marcas também.
            Unimos <em className="not-italic text-ink-primary">SEO tradicional, GEO e o novo
            protocolo WebMCP</em> para garantir presença nas pesquisas do Google — e nas
            respostas do ChatGPT, Gemini, Claude e Perplexity.
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
              to="/blog"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Ler artigos
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '5+', v: 'Motores de busca cobertos' },
              { k: '+120%', v: 'Tráfego orgânico médio' },
              { k: 'GEO', v: 'Optimização para LLMs' },
              { k: 'E-E-A-T', v: 'Framework Google' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink-tertiary">{s.v}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-10 flex flex-wrap gap-2.5"
          >
            {[
              'Google', 'ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Copilot', 'SGE',
            ].map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/20 px-4 py-2 text-[11px] md:text-xs uppercase tracking-[0.18em] text-white/70"
              >
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURE LIST */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Do SEO clássico ao GEO e WebMCP"
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
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/10 pt-16">
          <div className="text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Fluxo
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto">
              Do audit técnico à citação nas LLMs.
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { n: '01', t: 'Auditoria SEO & GEO', d: 'Técnica, conteúdo, backlinks e citações em LLMs.' },
              { n: '02', t: 'Keyword & prompt research', d: 'Intenções tradicionais e prompts generativos.' },
              { n: '03', t: 'Arquitetura & schema', d: 'IA-friendly, entidades e structured data.' },
              { n: '04', t: 'Implementação WebMCP', d: 'Protocolo, feeds e endpoints para LLMs.' },
              { n: '05', t: 'Conteúdo E-E-A-T', d: 'Produção com autoridade e profundidade real.' },
              { n: '06', t: 'Tracking & iteração', d: 'Google + LLMs, ciclos mensais de optimização.' },
            ].map((s) => (
              <div
                key={s.n}
                className="relative border border-white/15 rounded-2xl p-6 min-h-[220px] flex flex-col justify-end hover:border-white/40 transition-colors"
              >
                <span
                  className="absolute top-4 left-4 h-2 w-2 rounded-full"
                  style={{ background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }}
                />
                <span className="absolute top-8 right-6 font-mono text-5xl md:text-6xl font-bold text-white/[0.06]">
                  {s.n}
                </span>
                <h3 className="text-base md:text-lg font-bold leading-tight">{s.t}</h3>
                <p className="mt-2 text-xs md:text-sm text-white/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/10 pt-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Stack & Ferramentas
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            Ferramentas certas para o SEO clássico e para o mundo das LLMs.
          </h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Google Search Console', 'Bing Webmaster', 'GA4', 'Looker Studio',
              'Ahrefs', 'Semrush', 'Screaming Frog', 'Sitebulb',
              'Schema.org', 'JSON-LD', 'WebMCP', 'llms.txt',
              'Perplexity Rank', 'ChatGPT Search', 'Gemini SGE', 'Claude Cite',
              'PageSpeed Insights', 'Core Web Vitals', 'CrUX', 'Hotjar',
            ].map((item) => (
              <div
                key={item}
                className="border border-white/15 px-5 py-4 text-sm text-white/80 hover:border-[color:var(--accent)] transition-colors"
                style={{ ['--accent' as string]: ACCENT }}
              >
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
            O teu site está{' '}
            <span style={{ color: ACCENT }}>preparado</span> para o novo mundo das{' '}
            <span style={{ color: ACCENT }}>pesquisas em IA?</span>
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
              {contactOpen ? 'Fechar formulário' : 'Fala connosco'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'seo-geo-webmcp',
              name: 'SEO, GEO & WebMCP',
              accent: ACCENT,
              eyebrow: 'Briefing · SEO & AI Search',
              headline: 'Vamos preparar o teu site para Google e LLMs.',
              subhead: 'Conta-nos o teu contexto. Preparamos um plano de SEO + GEO + WebMCP com foco em visibilidade real e citações em respostas geradas por IA.',
              goalOptions: [
                'Auditoria SEO & GEO completa',
                'Aparecer no ChatGPT / Perplexity',
                'Implementar protocolo WebMCP',
                'Melhorar tráfego orgânico',
                'Estratégia de conteúdo E-E-A-T',
                'Link building & autoridade',
              ],
              messagePlaceholder: 'Domínio actual, mercados, principais páginas, prompts onde queres aparecer, estado do SEO técnico…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default SeoGeoWebmcp;
