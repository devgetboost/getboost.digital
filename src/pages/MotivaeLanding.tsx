import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Menos ruído.', 'Mais direção.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Coach IA Emocional',
    title: 'Um coach que te entende antes de te pedir mais.',
    tags: ['Estado emocional', 'Sugestões realistas', 'Reforço positivo', 'Adaptado ao ritmo'],
    body: 'O Coach IA da Motivae lê o teu estado emocional, sugere ações leves e ajuda-te a organizar prioridades com base no que sentes, não no que "deverias fazer". Acompanha a tua evolução diária, dá feedback humano e cria rotinas ajustadas ao teu ritmo real.',
  },
  {
    eyebrow: 'Clareza Emocional',
    title: 'Compreende o que sentes antes de agires.',
    tags: ['Check-in diário', 'Padrões de humor', 'Insights de energia', 'Foco em contexto'],
    body: 'Um check-in emocional curto revela padrões que passam despercebidos: quando rendes mais, o que te esgota, onde perdes foco. A Motivae transforma esses sinais em recomendações personalizadas para o teu dia.',
  },
  {
    eyebrow: 'Produtividade Leve',
    title: 'Organiza o dia sem gerar mais pressão.',
    tags: ['Prioridades inteligentes', 'Micro-objetivos', 'Rotinas adaptativas', 'Sem sobrecarga'],
    body: 'A Motivae organiza tarefas a partir da tua energia disponível. Divide grandes objetivos em micro-passos possíveis e ajusta a rotina consoante o estado emocional — nunca ao contrário. É produtividade que respeita o humano.',
  },
  {
    eyebrow: 'Jornada de Crescimento',
    title: 'Vê o teu progresso, semana após semana.',
    tags: ['Relatórios semanais', 'Hábitos saudáveis', 'Reforço motivacional', 'Evolução visível'],
    body: 'Cada semana ganha um relatório claro sobre humor, foco e cumprimento de rotinas. Descobres o que está a funcionar, o que ajustar e recebes reforço positivo que sustenta a mudança a longo prazo — sem culpa nem cobranças.',
  },
  {
    eyebrow: 'Ambiente Seguro',
    title: 'Um espaço calmo para pensares em ti.',
    tags: ['Interface minimalista', 'Linguagem humana', 'Privacidade total', 'Sem gamificação tóxica'],
    body: 'Design premium, tipografia respirada, linguagem empática. Nada de notificações agressivas, streaks culpabilizantes ou dashboards ansiosos. A Motivae é o oposto do ruído digital — um lugar privado onde te podes expressar com verdade.',
  },
];

const paraQuem = [
  'Profissionais com excesso de tarefas',
  'Estudantes em busca de organização emocional',
  'Criativos que precisam de foco',
  'Empreendedores com rotinas intensas',
  'Quem vive em piloto automático',
  'Quem quer viver com mais leveza',
];

const beneficios = [
  { k: 'Ansiedade', v: 'Reduzida em cada check-in' },
  { k: '+ Foco', v: 'Menos dispersão diária' },
  { k: 'Clareza', v: 'Mental e emocional' },
  { k: '0 burnout', v: 'Produtividade sustentável' },
];

const MotivaeLanding = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Motivae — Produtividade Emocional com IA | Getboost Digital"
        description="Plataforma de produtividade emocional que combina IA e psicologia leve para ajudar pessoas a viver com clareza, foco e direção — sem pressão."
        canonical="/motivae"
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
            Motivae · Produtividade Emocional · IA Humana
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
            A Motivae é a plataforma de <em className="not-italic text-white">produtividade emocional</em>
            {' '}que combina IA, psicologia leve e design humano. Um espaço seguro onde entendes o que sentes,
            organizas a mente e crias rotinas que respeitam o teu ritmo — sem pressão, sem culpa, sem burnout.
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
              Entrar na beta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
              Ver como funciona
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {beneficios.map((s) => (
              <div key={s.k}>
                <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="bg-[#0a0603] text-white border-t border-white/10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              O problema
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">
              Vives em piloto automático?
            </h2>
          </div>
          <ul className="md:col-span-8 grid sm:grid-cols-2 gap-x-10 gap-y-5 text-white/75 text-base md:text-lg">
            {[
              'Sobrecarga mental e emocional constante',
              'Falta de clareza sobre o que realmente importa',
              'Sensação de urgência que nunca desliga',
              'Ansiedade por tarefas acumuladas',
              'Dificuldade em manter foco por mais de 30 minutos',
              'Ciclo silencioso: culpa → procrastinação → frustração',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 border-b border-white/10 pb-4">
                <span className="mt-2 h-1.5 w-1.5 shrink-0" style={{ background: ACCENT }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FEATURE LIST — accordion */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-12 md:mb-16 max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              O que a Motivae faz
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl font-bold leading-[1.02] tracking-tight">
              Uma plataforma inteira desenhada à volta de <span style={{ color: ACCENT }}>como te sentes</span>.
            </h2>
          </div>

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

      {/* PARA QUEM */}
      <section className="bg-[#0a0603] text-white border-t border-white/10 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Para quem foi feita
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl font-bold leading-[1.02] tracking-tight">
              Pensada para quem sente <span style={{ color: ACCENT }}>demasiado</span> e organiza <span style={{ color: ACCENT }}>pouco</span>.
            </h2>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {paraQuem.map((p, i) => (
              <div key={p} className="bg-[#0a0603] p-8 md:p-10">
                <div className="font-mono text-xs" style={{ color: ACCENT }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <p className="mt-4 text-lg md:text-xl leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPOSTA DE VALOR */}
      <section className="bg-[#0a0603] text-white border-t border-white/10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Proposta de valor
          </span>
          <p className="mt-6 text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight">
            A Motivae não é mais uma app de produtividade.
            <br />
            É a primeira plataforma onde o foco nasce da{' '}
            <span style={{ color: ACCENT }}>clareza interior</span> — não da pressão.
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
            Prontos para viver com mais{' '}
            <span style={{ color: ACCENT }}>clareza</span>?
          </motion.h2>
          <p className="mt-8 max-w-2xl mx-auto text-white/60 text-lg">
            Entra na beta privada da Motivae e recebe acesso antecipado ao Coach IA emocional.
          </p>

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
              {contactOpen ? 'Fechar formulário' : 'Pedir acesso à beta'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'motivae',
              name: 'Motivae',
              accent: ACCENT,
              eyebrow: 'Beta · Motivae',
              headline: 'Vamos conhecer o teu ritmo antes de dar acesso.',
              subhead: 'Conta-nos onde te sentes sobrecarregado e o que gostavas de organizar. Enviamos convite prioritário para a beta privada.',
              goalOptions: [
                'Reduzir ansiedade e sobrecarga',
                'Organizar prioridades do dia',
                'Criar rotinas sustentáveis',
                'Melhorar foco e produtividade',
                'Explorar coach IA emocional',
              ],
              messagePlaceholder: 'O que sentes hoje quando pensas no teu dia? Onde perdes mais energia?',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default MotivaeLanding;
