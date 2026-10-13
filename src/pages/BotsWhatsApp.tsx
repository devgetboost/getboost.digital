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

const manifestoLines = ['WhatsApp &', 'Conversational AI.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Integração Nativa',
    title: 'API Cloud Oficial da Meta',
    tags: ['WhatsApp Cloud API', 'Número Verificado', 'Segurança Meta', 'Estabilidade Total'],
    body: 'Integramos através da API oficial do Meta para garantir a segurança dos números profissionais e escalabilidade real. Envio em massa sem bloqueios e acesso a funcionalidades exclusivas como botões interativos e catálogos.',
  },
  {
    eyebrow: 'Linguagem Natural',
    title: 'Agentes de IA que Falam como Nós',
    tags: ['Processamento NLP', 'Treino Customizado', 'Respostas Instantâneas', 'Vendas Autónomas'],
    body: 'Os nossos agentes conversam como verdadeiros humanos. Entendem contexto, histórico de cada cliente e oferecem uma conversa relevante — sem parecer robô, sem soar a script.',
  },
  {
    eyebrow: 'Recuperar Vendas de Forma Automática',
    title: 'Fluxos de Conversão e Recuperação',
    tags: ['Recuperação de Carrinho', 'Alertas de Envio', 'Click-to-WhatsApp Ads', 'Faturação Automática'],
    body: 'As pessoas são constantemente distraídas e os carrinhos abandonados são uma constante. Com IA integrada ao WhatsApp, recuperamos qualquer carrinho de forma simples e fluida — dentro do canal onde o cliente já está.',
  },
  {
    eyebrow: 'Garantir Taxa de Aberturas',
    title: 'Campanhas de Broadcast de Alto Impacto',
    tags: ['Envio em Massa Seguro', 'Segmentação de Audiência', 'A/B Testing', 'Relatórios de Leitura'],
    body: 'Envio em massa via WhatsApp só é seguro por integração oficial. Garantimos entrega nativa e sem falhas, analisamos os dados de cada utilizador para envios segmentados e medimos leitura, cliques e conversão.',
  },
  {
    eyebrow: 'Integração com Diferentes Plataformas',
    title: 'Integração Total com Qualquer Negócio',
    tags: ['Shopify & Woo Sync', 'HubSpot / CRM Connect', 'Webhooks & Workflows', 'Dashboard Único'],
    body: 'Integramos nativamente o WhatsApp com Shopify, WooCommerce, HubSpot ou Salesforce. Ter o histórico do cliente centralizado é essencial para segmentar bem e ter conversas relevantes em cada etapa.',
  },
];

const AI = PILLARS.ai;

const BotsWhatsApp = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="bots" />
      <SEO
        title="WhatsApp & Conversational AI — Bots de WhatsApp com IA | Getboost Digital"
        description="Transformamos o WhatsApp num canal de vendas inteligente com API oficial da Meta e agentes de IA que atendem, qualificam e fecham negócio 24/7."
        canonical="/solucoes/bots-whatsapp-ia"
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
            API Oficial · AI Agents · Alta Conversão · Escalável
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
            Zero atritos na comunicação. Conversamos onde o cliente já está. Usamos a API Cloud
            oficial do Meta para transformar o WhatsApp num canal de vendas imparável — com agentes
            de IA que atendem, qualificam e fecham negócio em tempo real. Não só leads: vendas
            online também.
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
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => analytics.trackClick('bots_hero', 'bots_contact', 'consideration')}>
              Falar com Especialista
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria comercial 7 min
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {[
              { k: '98%', v: 'Taxa de leitura' },
              { k: '24/7', v: 'Atendimento sem pausas' },
              { k: '<3s', v: 'Tempo de resposta' },
              { k: '∞', v: 'Conversas em paralelo' },
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

      {/* FEATURE LIST — accordion */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Do broadcast à conversa que vende"
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
                steps={['Integração Nativa', 'Linguagem Natural', 'Recuperar Vendas de Forma Automática', 'Garantir Taxa de Aberturas', 'Integração com Diferentes Plataformas']}
                tint="var(--gb-ai-tint)"
                strong="var(--gb-ai-strong)"
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
            {AI.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-ai-strong)' }}><CountUp value={p.k} /></div>
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

<section className="gb-surface-page gb-section">
        <div className="gb-container"><div className="gb-cta-band relative overflow-hidden border border-white/10 text-center"><div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse"
          >
            Vamos transformar o{' '}
            <span style={{ color: ACCENT }}>WhatsApp</span> numa{' '}
            <span style={{ color: ACCENT }}>ferramenta de vendas inteligente</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com Especialista'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'bots-whatsapp-ia',
              name: 'WhatsApp & Conversational AI',
              accent: ACCENT,
              eyebrow: 'Briefing · WhatsApp AI',
              headline: 'Vamos transformar o WhatsApp num canal de vendas.',
              subhead: 'Diz-nos como estás a usar o WhatsApp hoje. Desenhamos um fluxo conversacional que qualifica leads, responde 24/7 e integra com o teu CRM.',
              goalOptions: [
                'Automatizar atendimento 24/7',
                'Qualificar e agendar leads',
                'Recuperar carrinhos / follow-ups',
                'Envio massivo com API oficial',
                'Integrar com CRM / ERP existente',
              ],
              messagePlaceholder: 'Volume de mensagens/dia, ferramenta actual (WhatsApp Business App? API?), integrações necessárias…',
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

export default BotsWhatsApp;
