import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';

const ACCENT = '#ff4000';

const manifestoLines = ['Resultados reais.', 'Clientes que escalaram.'];

type CaseStudy = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
  to?: string;
};

const cases: CaseStudy[] = [
  {
    eyebrow: 'Hospitality · SaaS PMS',
    title: 'Hostify — do produto ao pipeline',
    tags: ['+312% MQLs em 6 meses', 'Onboarding -40% tempo', 'CAC pago -28%', 'Landing modular'],
    body: 'Reposicionámos a Hostify de um PMS técnico para uma plataforma comercial. Nova narrativa, landing modular por persona (host, gestor de propriedades, cadeia), tracking end-to-end e sequências de nurturing. Em seis meses, o pipeline qualificado triplicou e o custo por lead pago caiu quase um terço.',
    to: '/hostify',
  },
  {
    eyebrow: 'Food & Beverage · POS',
    title: 'Qook — POS que se vende sozinho',
    tags: ['Roteiro de demo IA', 'Página multi-vertical', 'Time-to-demo -55%', 'Onboarding self-serve'],
    body: 'Desenhámos uma landing multi-vertical (restauração, take-away, food-trucks) com agendamento inteligente de demo e um agente de IA que qualifica em tempo real. O time-to-demo caiu para metade e o comercial passou a receber apenas leads com fit real.',
    to: '/qook',
  },
  {
    eyebrow: 'RH & Engagement',
    title: 'Motivae — plataforma que gera adesão',
    tags: ['+8x sessões orgânicas', 'Content engine mensal', 'SEO técnico completo', 'Casos por indústria'],
    body: 'Construímos a presença digital da Motivae de raiz: arquitectura de informação, SEO técnico, engine de conteúdo mensal e páginas de caso por indústria. A pesquisa orgânica passou a ser o principal canal de aquisição, com custo marginal por lead.',
    to: '/motivae',
  },
  {
    eyebrow: 'Segurança · SaaS B2B',
    title: 'ProSafe360 — narrativa que vende compliance',
    tags: ['ICP redefinido', 'Demo agendada em 2 clicks', 'Ciclo de venda -35%', 'Materiais comerciais'],
    body: 'Redefinimos o ICP, reescrevemos a proposta de valor e reconstruímos o funil de aquisição. Comerciais passaram a entrar em reuniões com leads já educados sobre normas ISO, DUER e obrigações legais — o ciclo de venda encurtou em mais de um terço.',
    to: '/prosafe360',
  },
  {
    eyebrow: 'Design & Print · SaaS',
    title: 'Pikto — do editor ao ecossistema',
    tags: ['Storytelling de produto', 'Roadmap comunicado', 'Comunidade activa', '+140% trials'],
    body: 'Ajudámos a Pikto a comunicar o salto de editor gráfico para ecossistema criativo. Storytelling de produto, roadmap público, comunidade em torno de casos reais e campanhas coordenadas de lançamento — mais do que dobrou o número de trials qualificados.',
    to: '/pikto',
  },
  {
    eyebrow: 'Logística & Frota',
    title: 'Trackfy — tecnologia acessível para PMEs',
    tags: ['Reposicionamento para PMEs', 'Calculadora de ROI', 'Nurturing por vertical', 'Time-to-value -50%'],
    body: 'Trazemos a Trackfy do universo enterprise para PMEs de transporte e distribuição. Nova mensagem, calculadora de ROI pública, sequências por vertical (frota ligeira, pesada, distribuição urbana) e onboarding assistido — reduzindo o time-to-value para metade.',
    to: '/trackfy',
  },
];

const CasosSucesso = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <Layout>
      <SEO
        title="Casos de Sucesso | Getboost Digital"
        description="PMEs e SaaS que escalaram com a Getboost: reposicionamento, funis, produto e IA. Casos reais, métricas concretas, sem letra pequena."
        canonical="/casos-de-sucesso"
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
            Casos de Sucesso · SaaS · PMEs · Growth
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
            Não vendemos <em className="not-italic text-white">promessas</em>. Mostramos empresas
            reais, decisões reais e as métricas que mudaram. Cada projecto abaixo é público,
            verificável e pode ser referenciado directamente com o cliente.
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
              Quero um caso destes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Trophy className="h-4 w-4" style={{ color: ACCENT }} />
              Ver portfólio completo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '+40', v: 'Projectos entregues' },
              { k: '3x', v: 'Pipeline médio pós-launch' },
              { k: '-35%', v: 'Ciclo de venda B2B' },
              { k: '90d', v: 'Do briefing ao live' },
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

      {/* CASES — accordion */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10">
            {cases.map((f, i) => {
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
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm md:text-base leading-relaxed text-white/70">
                              {f.body}
                            </p>
                            {f.to && (
                              <Link
                                to={f.to}
                                className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em]"
                                style={{ color: ACCENT }}
                              >
                                Ver caso completo <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </motion.div>
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

      {/* CTA */}
      <section className="bg-black text-white py-28 md:py-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            O próximo{' '}
            <span style={{ color: ACCENT }}>caso de sucesso</span> pode ser{' '}
            <span style={{ color: ACCENT }}>o teu</span>.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Falar com um consultor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default CasosSucesso;
