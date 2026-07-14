import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Menos risco.', 'Mais prevenção.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Avaliações Avançadas',
    title: 'Riscos, Ergonomia e Psicossocial num Só Motor',
    tags: ['Matriz de Risco', 'Ergonomia', 'Psicossocial', 'Planos de Acção'],
    body: 'Executa avaliações completas por posto de trabalho, tarefa e colaborador. O Prosafe360 combina metodologias reconhecidas com fluxos guiados para identificar, classificar e mitigar riscos — do físico ao psicossocial — com planos de acção automáticos e responsáveis atribuídos.',
  },
  {
    eyebrow: 'Gestão Operacional',
    title: 'EPI, Acções Preventivas, Registos Sanitários, Paragens e Acidentes',
    tags: ['EPI & Fardamento', 'Preventivas', 'Sanitários', 'Acidentes'],
    body: 'Centraliza tudo o que acontece no terreno: entregas e validades de EPI, acções preventivas com prazos e evidências, registos sanitários por colaborador, paragens de equipamento e investigação de acidentes com árvore de causas — sem folhas de cálculo dispersas.',
  },
  {
    eyebrow: 'Emergência & Autoproteção',
    title: 'Planos, Simulacros e Resposta Coordenada',
    tags: ['Planos de Emergência', 'Autoproteção', 'Simulacros', 'Rotas de Evacuação'],
    body: 'Elabora, versiona e distribui planos de emergência e medidas de autoproteção. Programa simulacros com checklists, cronómetros e relatórios de desempenho — e mantém toda a equipa preparada para responder quando conta.',
  },
  {
    eyebrow: 'Conformidade Contínua',
    title: 'Auditorias, Inspecções e Reuniões SST',
    tags: ['Auditorias', 'Inspecções', 'Actas SST', 'Não-Conformidades'],
    body: 'Agenda auditorias e inspecções recorrentes com checklists digitais, fotos, assinaturas e planos correctivos. Regista reuniões SST, decisões e follow-ups num só sítio, com histórico auditável para clientes, seguradoras e autoridades.',
  },
  {
    eyebrow: 'Colaboradores & Comunicação',
    title: 'Histórico, Funções, Riscos e EPIs por Pessoa',
    tags: ['Ficha do Colaborador', 'Funções & Riscos', 'Formações', 'Comunicação Interna'],
    body: 'Cada colaborador tem uma ficha viva: funções, riscos associados, EPIs atribuídos, formações, exames médicos e acidentes. Distribui comunicados, políticas e alertas segmentados por função ou área — todos os avisos chegam a quem precisa.',
  },
  {
    eyebrow: 'Prosafe360 · IA & Painel TV',
    title: 'Dashboards Inteligentes, Relatórios Automáticos e IA Integrada',
    tags: ['Painel TV', 'IA Preditiva', 'KPIs SST', 'Relatórios Automáticos'],
    body: 'Dashboards executivos, relatórios gerados automaticamente e um Painel TV para o chão de fábrica ou escritório. A IA integrada sugere prioridades, antecipa incidentes com base no histórico e transforma dados dispersos em decisões claras — sem esforço manual.',
  },
];

const Prosafe360Landing = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Prosafe360 — Plataforma SaaS de Segurança e Saúde no Trabalho | Getboost Digital"
        description="Prosafe360 é a plataforma SaaS completa de SST: avaliações, EPI, emergência, auditorias, IA e Painel TV. Reduz riscos, garante conformidade e automatiza rotinas."
        canonical="/prosafe360"
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
            Prosafe360 · SST · Conformidade · IA
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
            O Prosafe360 é a plataforma SaaS que reúne toda a gestão de Segurança e Saúde no
            Trabalho num único ecossistema — avaliações, operação, emergência, conformidade e
            <em className="not-italic text-white"> IA que transforma dados em prevenção</em>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/demo?produto=prosafe360"
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
              Falar com um especialista SST
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '1', v: 'Ecossistema para toda a SST' },
              { k: '24/7', v: 'Alertas e IA preditiva' },
              { k: '∞', v: 'Colaboradores, EPIs e riscos' },
              { k: '360º', v: 'Da avaliação à conformidade' },
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
            Prosafe360 transforma <span style={{ color: ACCENT }}>dados em decisões</span>,{' '}
            <span style={{ color: ACCENT }}>alertas em prevenção</span> e processos complexos em
            fluxos simples — para empresas que querem elevar a segurança, reduzir custos e
            aumentar a conformidade.
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
            Pronto para elevar a <span style={{ color: ACCENT }}>segurança</span> e a{' '}
            <span style={{ color: ACCENT }}>conformidade</span> da tua operação?
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
              {contactOpen ? 'Fechar formulário' : 'Pedir demonstração Prosafe360'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'prosafe360',
              name: 'Prosafe360',
              accent: ACCENT,
              eyebrow: 'Demonstração · Prosafe360',
              headline: 'Vamos desenhar a tua gestão SST em Prosafe360.',
              subhead: 'Conta-nos quantos colaboradores tens, os riscos principais e onde precisas de ganhar controlo. Marcamos uma demonstração personalizada.',
              goalOptions: [
                'Centralizar toda a gestão SST',
                'Reduzir riscos e acidentes',
                'Garantir conformidade legal',
                'Automatizar auditorias e inspecções',
                'Gerir EPI e formações',
                'Adicionar IA e Painel TV à operação',
              ],
              messagePlaceholder: 'Nº de colaboradores, sectores de actividade, sistemas actuais…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default Prosafe360Landing;
