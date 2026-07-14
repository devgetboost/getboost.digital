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

const manifestoLines = ['Não financias ideias.', 'Financias operação.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Portefólio Ativo',
    title: 'Um estúdio, vários produtos SaaS',
    tags: ['Qook', 'Hostify PMS', 'Motivae', 'Trackfy', 'ProSafe360', 'Pikto'],
    body: 'Não somos uma startup de um único produto. Operamos como venture studio, com vários SaaS já lançados ou em beta, cada um a atacar um mercado vertical distinto. Isto dilui risco e permite ao investidor escolher a tese em que quer entrar — hotelaria, restauração, HR tech, safety ou tracking.',
  },
  {
    eyebrow: 'Modalidades de Entrada',
    title: 'SAFE, equity ou dívida convertível',
    tags: ['Business Angel', 'SAFE Notes', 'Equity Seed', 'Convertible', 'Ticket a partir de 3.000€'],
    body: 'Estruturamos o teu ticket na modalidade que faz sentido para o teu perfil. Aceitamos entradas via SAFE (mais rápido, sem valorização fechada), equity direta em ronda seed ou dívida convertível para investidores mais conservadores. Toda a documentação legal é preparada por escritório português, com cap table sempre atualizada.',
  },
  {
    eyebrow: 'Governance & Transparência',
    title: 'Reporte trimestral e dashboard aberto',
    tags: ['P&L mensal', 'MRR/ARR em tempo real', 'Reunião trimestral', 'Board consultivo'],
    body: 'Cada investidor recebe acesso a dashboard próprio com métricas de negócio (MRR, churn, CAC, LTV) atualizadas em tempo real. Trimestralmente enviamos relatório executivo com contas, roadmap e desafios. Investidores acima de 25.000€ integram board consultivo com voz no direcionamento estratégico.',
  },
  {
    eyebrow: 'Estratégia de Saída',
    title: 'Exit por aquisição estratégica ou secundário',
    tags: ['M&A Vertical', 'Ronda Series A', 'Buyback Fundador', 'Horizonte 4-6 anos'],
    body: 'O nosso plano de exit combina duas rotas: aquisição por players verticais (Booking, TheFork, plataformas de segurança) num horizonte de 4 a 6 anos, ou secundário parcial em ronda Series A. Existe ainda opção de buyback pelo fundador em condições pré-acordadas, garantindo liquidez mesmo em cenários mais conservadores.',
  },
  {
    eyebrow: 'Impacto e Alinhamento',
    title: 'Tecnologia portuguesa a exportar',
    tags: ['HQ em Portugal', 'Mercados PT · BR · ES', 'Emprego qualificado', 'IA aplicada'],
    body: 'Ao investir na Getboost estás a apoiar tecnologia desenvolvida em Portugal e exportada para mercados de língua portuguesa e espanhola. O capital angariado é aplicado em contratação de engenharia sénior, aquisição de clientes e infraestrutura de IA — não em despesas de estrutura desnecessárias.',
  },
];

const Investidores = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Investidores — Portefólio SaaS da Getboost | Oportunidades de Investimento"
        description="Investe num venture studio português com vários SaaS ativos: Qook, Hostify, Motivae, Trackfy, ProSafe360 e Pikto. Tickets desde 3.000€, SAFE ou equity, reporte trimestral e board consultivo."
        canonical="/investidores"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO — manifesto */}
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
            Venture Studio · SaaS · SAFE · Equity
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
            A Getboost é um <em className="not-italic text-white">venture studio</em> português com
            seis produtos SaaS a operar em mercados verticais reais. Investes num portefólio já
            construído, com clientes pagantes e roadmap validado — não numa apresentação em PDF.
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
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir Deck Investidor
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Agendar call com fundador
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '6', v: 'Produtos SaaS ativos' },
              { k: '3', v: 'Mercados: PT · BR · ES' },
              { k: '3.000€', v: 'Ticket mínimo' },
              { k: '4-6 anos', v: 'Horizonte de exit' },
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

      {/* FEATURE LIST — accordion */}
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
            Queres entrar no{' '}
            <span style={{ color: ACCENT }}>próximo capítulo</span> da{' '}
            <span style={{ color: ACCENT }}>Getboost</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Receber deck e cap table'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'investidores',
              name: 'Investidores',
              accent: ACCENT,
              eyebrow: 'Briefing · Investidor',
              headline: 'Vamos apresentar-te o portefólio.',
              subhead: 'Diz-nos o teu perfil, ticket previsto e projetos de maior interesse. Enviamos deck detalhado, cap table e agendamos call com o fundador.',
              goalOptions: [
                'Business Angel — ticket até 10.000€',
                'SAFE — 10.000€ a 25.000€',
                'Equity Seed — acima de 25.000€',
                'Dívida convertível',
                'Ainda a explorar tese',
              ],
              messagePlaceholder: 'Ticket previsto, projetos de interesse (Qook, Hostify, Motivae…), horizonte de investimento e experiência prévia em SaaS.',
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

export default Investidores;
