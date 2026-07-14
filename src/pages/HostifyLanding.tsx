import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Menos tarefas manuais.', 'Mais reservas confirmadas.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'PMS Moderno',
    title: 'Gestão Central de Reservas e Propriedades',
    tags: ['Multi-propriedades', 'Calendário Unificado', 'Consumos & PDV', 'Domínio Personalizado'],
    body: 'Um PMS pensado para anfitriões que operam várias unidades sem perder o controlo. Reservas, hóspedes, quartos, tarifas e consumos numa única vista — com atribuição automática, bloqueios inteligentes e histórico completo de cada propriedade.',
  },
  {
    eyebrow: 'Channel Manager & Motor de Reservas',
    title: 'Vende em Todos os Canais Sem Comissões Ocultas',
    tags: ['Booking · Airbnb · Google', 'Motor Próprio 0% Comissão', 'Sync em Tempo Real', 'Tarifário Dinâmico'],
    body: 'Sincroniza disponibilidade e preços entre Booking, Airbnb, Expedia e Google Business, e recebe reservas diretas pelo motor incluído — sem comissões de intermediários. O tarifário dinâmico ajusta preços à ocupação e à procura, protegendo margem em qualquer época.',
  },
  {
    eyebrow: 'Experiência do Hóspede',
    title: 'Check-in Online, Portal do Hóspede e Comunicação Automatizada',
    tags: ['Check-in Digital', 'Portal do Hóspede', 'WhatsApp Integrado', 'Multilíngue'],
    body: 'O hóspede confirma dados, faz upload de documentos e recebe instruções antes de chegar. Durante a estadia, o portal centraliza pedidos, extras e comunicação — e no WhatsApp as respostas chegam quando é preciso, no idioma certo.',
  },
  {
    eyebrow: 'Operações & Financeiro',
    title: 'Pagamentos, Housekeeping e Relatórios Estratégicos',
    tags: ['Cobranças Automáticas', 'Housekeeping', 'KPIs de Ocupação', 'Multi-utilizador'],
    body: 'Cobra depósitos e saldos de forma automática, organiza turnos de limpeza e manutenção, e acompanha ocupação, RevPAR, ADR e receita por canal em relatórios claros. Toda a equipa trabalha na mesma plataforma, com permissões por função.',
  },
  {
    eyebrow: 'Hostify Premium · IA',
    title: 'Agentes de IA, Previsões e Automações Inteligentes',
    tags: ['Assistente 24/7', 'Previsão de Ocupação', 'Pricing Sugerido', 'Campanhas Automáticas'],
    body: 'No plano Premium, a Hostify ganha um agente de IA que responde a hóspedes 24/7, sugere tarifas, prevê ocupação, dispara campanhas de reactivação e devolve insights estratégicos. Tecnologia ao serviço da hospitalidade — sem substituir o toque humano.',
  },
];

const HostifyLanding = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Hostify — PMS, Channel Manager e IA para Alojamentos | Getboost Digital"
        description="A Hostify centraliza reservas, canais, hóspedes, pagamentos e IA num único sistema. Vende mais, automatiza operações e escala sem complicar."
        canonical="/hostify"
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
            Hostify · PMS · Channel Manager · IA
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
            A Hostify reúne num único sistema tudo o que um anfitrião precisa para gerir,
            automatizar e escalar. PMS moderno, channel manager, motor de reservas sem comissões
            e — no plano Premium — <em className="not-italic text-white">IA que trabalha por ti</em>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/demo?produto=hostify"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir Demonstração
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Falar com um consultor
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '0%', v: 'Comissões no motor próprio' },
              { k: '24/7', v: 'Agente IA para hóspedes' },
              { k: '1', v: 'Plataforma para toda a operação' },
              { k: '∞', v: 'Propriedades e canais' },
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

      {/* FEATURES */}
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

      {/* VALUE STATEMENT */}
      <section className="bg-[#0a0603] text-white py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-2xl md:text-3xl leading-relaxed text-white/85 font-light">
            Hostify é mais do que software — é a ponte entre a{' '}
            <span style={{ color: ACCENT }}>hospitalidade humana</span> e a{' '}
            <span style={{ color: ACCENT }}>eficiência tecnológica</span>, ajudando alojamentos a
            vender mais, trabalhar melhor e encantar hóspedes todos os dias.
          </p>
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
            Pronto para gerir com{' '}
            <span style={{ color: ACCENT }}>clareza</span> e crescer sem{' '}
            <span style={{ color: ACCENT }}>complicações</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Pedir demonstração Hostify'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'hostify',
              name: 'Hostify',
              accent: ACCENT,
              eyebrow: 'Demonstração · Hostify',
              headline: 'Vamos configurar a tua operação de alojamento.',
              subhead: 'Conta-nos quantas propriedades geres, que canais usas e onde queres ganhar tempo. Marcamos uma demonstração personalizada da Hostify.',
              goalOptions: [
                'Centralizar reservas e canais',
                'Reduzir comissões com motor próprio',
                'Automatizar comunicação com hóspedes',
                'Adicionar IA à minha operação (Premium)',
                'Migrar de outro PMS',
              ],
              messagePlaceholder: 'Nº de propriedades, canais actuais (Booking, Airbnb…), PMS que utilizas hoje…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default HostifyLanding;
