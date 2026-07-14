import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import type { StoredAudit } from '@/lib/auditHistory';

const ACCENT = '#ff4000';

const manifestoLines = ['Software não se compra.', 'Escala-se.'];

type Feature = { eyebrow: string; title: string; tags: string[]; body: string };

const features: Feature[] = [
  {
    eyebrow: 'Product Discovery',
    title: 'Do problema ao MVP com foco cirúrgico',
    tags: ['Entrevistas de Utilizador', 'Definição de ICP', 'Priorização RICE', 'North-Star Metric'],
    body: 'Antes de escrever código, alinhamos problema, cliente ideal e métrica-chave. Cortamos features que não movem o negócio e concentramos o MVP no que valida hipóteses reais — não no que impressiona em slides.',
  },
  {
    eyebrow: 'Arquitectura Multi-Tenant',
    title: 'Preparado para 10 ou 10.000 clientes',
    tags: ['Multi-tenant Seguro', 'Row-Level Security', 'Feature Flags', 'Observabilidade'],
    body: 'Modelo de dados isolado por cliente, RLS activa desde o primeiro deploy, feature flags para rollouts controlados e logs/traços que permitem debug em produção sem stress. Não somamos dívida técnica em nome da velocidade.',
  },
  {
    eyebrow: 'Billing e Monetização',
    title: 'Assinaturas, add-ons e trials sem dor',
    tags: ['Stripe / Paddle', 'Trials & Freemium', 'Metered Billing', 'Dunning e Retenção'],
    body: 'Integração completa com Stripe ou Paddle: planos, upgrades, downgrades, cobrança por utilização, provas gratuitas e recuperação de pagamentos falhados. Métricas de MRR, churn e LTV disponíveis desde o dia do lançamento.',
  },
  {
    eyebrow: 'IA como Vantagem Competitiva',
    title: 'Modelos integrados no produto, não colados',
    tags: ['LLMs em Contexto', 'RAG sobre Dados do Cliente', 'Agentes Autónomos', 'Guardrails'],
    body: 'IA embebida no fluxo de trabalho dos utilizadores — copilots, respostas contextuais, automação de tarefas repetitivas. Sempre com guardrails, dados isolados por tenant e custos monitorizados por conta.',
  },
  {
    eyebrow: 'Operação e Suporte',
    title: 'DevOps, CI/CD e SLAs desde o dia 1',
    tags: ['Deploy Contínuo', 'Ambientes Isolados', 'Monitorização 24/7', 'Runbooks e Alertas'],
    body: 'Pipelines automáticos, ambientes de staging e produção isolados, alertas ligados a on-call e runbooks documentados. Entregamos SaaS pronto para SLA — não protótipos que caem à primeira carga real.',
  },
];

const DesenvolvimentoSaaS = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Desenvolvimento SaaS — Plataformas Multi-Tenant e Produtos Digitais | Getboost Digital"
        description="Construímos plataformas SaaS multi-tenant escaláveis: MVP, billing, IA integrada e operação pronta para SLA."
        canonical="/solucoes/desenvolvimento-software"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            SaaS · Multi-Tenant · Billing · IA
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.75rem,8vw,7rem)]">
            {manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === manifestoLines.length - 1 ? (
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>{line}</span>
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
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
          >
            Não construímos <em className="not-italic text-white">projectos únicos</em>. Construímos
            produtos SaaS que servem centenas de clientes com o mesmo código, cobram sozinhos,
            evoluem com dados e transformam o teu negócio numa fonte de receita recorrente.
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
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir Proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria de produto 7 min
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: 'MVP 60d', v: 'Do briefing ao lançamento' },
              { k: 'Multi-tenant', v: 'RLS activa desde o dia 1' },
              { k: 'MRR-ready', v: 'Billing e métricas prontas' },
              { k: '24/7', v: 'Observabilidade e alertas' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10">
            {features.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={f.title} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <div className="flex items-start gap-5">
                        <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                        </span>
                        <h3 className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-10 flex flex-wrap gap-3">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/25 px-4 py-1.5 text-xs md:text-sm text-white/80"
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
                          style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.6)' }}
                        >
                          {f.eyebrow}
                        </span>
                        <Minus
                          className="h-6 w-6 shrink-0 transition-transform"
                          style={{
                            color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)',
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
                            className="overflow-hidden text-sm md:text-base leading-relaxed text-white/70"
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

      <section className="bg-black text-white py-28 md:py-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Tens uma <span style={{ color: ACCENT }}>ideia de produto</span>?{' '}
            <span style={{ color: ACCENT }}>Vamos construí-la</span>.
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'desenvolvimento-software',
              name: 'Desenvolvimento SaaS',
              accent: ACCENT,
              eyebrow: 'Briefing · Desenvolvimento SaaS',
              headline: 'Vamos desenhar o teu próximo produto.',
              subhead: 'Conta-nos o problema que queres resolver, público-alvo e modelo de receita. Devolvemos uma proposta com MVP, arquitectura e cronograma.',
              goalOptions: [
                'Validar um MVP SaaS',
                'Escalar um produto existente',
                'Migrar de projecto único para multi-tenant',
                'Integrar IA no meu produto',
                'Ainda a explorar',
              ],
              messagePlaceholder: 'Público-alvo, modelo de subscrição, integrações (Stripe, CRM, ERP), volumetria esperada…',
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

export default DesenvolvimentoSaaS;
