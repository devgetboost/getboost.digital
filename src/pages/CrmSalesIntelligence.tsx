import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';


const ACCENT = '#ff4000';


const manifestoLines = ['CRM parado é', 'dinheiro parado.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Tomada de Decisão com Base em Dados',
    title: 'Lead Scoring Preditivo',
    tags: ['Qualificação Automática', 'Análise de Intenção', 'Priorização de Pipeline', 'Redução de Churn'],
    body: 'A tua equipa comercial deixa de gastar tempo em leads frios. Cruzamos histórico, sinais de comportamento e dados de contexto para pontuar cada oportunidade em tempo real e direcionar o esforço para quem está realmente perto de fechar.',
  },
  {
    eyebrow: 'Alimentar Oportunidades',
    title: 'Nutrição de Leads 24/7',
    tags: ['Follow-up Autónomo', 'Agendamento por IA', 'Mensagens Personalizadas', 'Multi-canal Sync'],
    body: 'Cada lead sem resposta é receita perdida. Os agentes fazem follow-up com contexto, respondem a dúvidas técnicas e marcam reuniões dentro do CRM — em email, WhatsApp ou LinkedIn, sem intervenção manual.',
  },
  {
    eyebrow: 'Análise de Sentimento',
    title: 'Sentimento e Intenção em Cada Interação',
    tags: ['NLP Analysis', 'Deteção de Objeções', 'Mood Tracking', 'Relatórios de Call Insight'],
    body: 'Decisões comerciais deixam de ser intuição. Analisamos chamadas, emails e chats para detetar risco, objeções recorrentes e sinais de compra — para que a equipa entre na conversa certa, no momento certo, com o argumento certo.',
  },
  {
    eyebrow: 'Previsão de Vendas',
    title: 'Forecast em Tempo Real',
    tags: ['Forecasting IA', 'Pipeline Health', 'Real-time Dashboards', 'ROI Tracking'],
    body: 'Prever faturação a partir de folhas de cálculo é passado. Modelos preditivos leem o pipeline ativo, taxas históricas e velocidade de negociação para projetar receita real e sinalizar riscos antes que se tornem problemas.',
  },
  {
    eyebrow: 'Integrações Diretas',
    title: 'Camada de IA em HubSpot, Salesforce, Pipedrive e Zoho',
    tags: ['HubSpot AI', 'Salesforce Einstein', 'Pipedrive Integrations', 'Zoho Automation'],
    body: 'Não trocamos o teu CRM — potenciamos o que já tens. Instalamos camadas inteligentes de automação e IA sobre o CRM em uso para ganhar eficiência, precisão e velocidade sem custos de migração.',
  },
];

const CrmSalesIntelligence = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  


  return (
    <Layout>
      <SEO
        title="CRM & Sales Intelligence — Vendas Orientadas por IA | Getboost Digital"
        description="Camadas de IA sobre o teu CRM: lead scoring preditivo, forecast em tempo real, nutrição autónoma e análise de sentimento. Vendas com previsibilidade."
        canonical="/crm-sales-intelligence"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO */}
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
          style={{
            background:
              'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)',
          }}
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
            Smart CRM · Sales AI · Predictive · Automation
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
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
          >
            Instalamos camadas de inteligência artificial sobre o CRM que já usas —
            HubSpot, Salesforce, Pipedrive ou Zoho — para pontuar leads, prever vendas,
            automatizar follow-ups e transformar dados em decisões comerciais em tempo real.
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
              Falar com Especialista
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => setAuditOpen(true)}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria comercial 7 min
            </button>

          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '+38%', v: 'Taxa de conversão média' },
              { k: '-62%', v: 'Tempo em follow-ups manuais' },
              { k: '2.4x', v: 'Precisão do forecast' },
              { k: '24/7', v: 'Nutrição de leads' },
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

      {/* FEATURE LIST */}
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

      {/* CTA FINAL */}
      <section className="bg-black text-white py-28 md:py-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Pronto para ter um{' '}
            <span style={{ color: ACCENT }}>CRM</span>{' '}
            <span style={{ color: ACCENT }}>verdadeiramente inteligente</span>?
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
              slug: 'crm-sales-intelligence',
              name: 'CRM & Sales Intelligence',
              accent: ACCENT,
              eyebrow: 'Briefing · CRM & Vendas',
              headline: 'Vamos colocar o teu CRM a trabalhar.',
              subhead: 'Conta-nos como está a tua operação comercial hoje. Desenhamos uma implementação de CRM com automações e previsibilidade de pipeline.',
              goalOptions: [
                'Implementar CRM do zero',
                'Migrar / arrumar CRM actual',
                'Automatizar follow-ups',
                'Ganhar previsibilidade de pipeline',
                'Integrar CRM com marketing / ads',
              ],
              messagePlaceholder: 'Ferramenta actual (HubSpot, Pipedrive, folhas…), tamanho da equipa comercial, número médio de leads/mês…',
            }}
          />
        </div>
      </section>
      <CommercialAuditModal open={auditOpen} onClose={() => setAuditOpen(false)} />
      
    </Layout>

  );
};

export default CrmSalesIntelligence;
