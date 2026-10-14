import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Check,
  Brain,
  Heart,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { ScrollDepth } from '@/components/ScrollDepth';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CaseProofStrip } from '@/components/CaseProofStrip';
import { CountUp } from '@/components/ui/count-up';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { analytics } from '@/lib/analytics';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

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

const problemas = [
  'Sobrecarga mental e emocional constante',
  'Falta de clareza sobre o que realmente importa',
  'Sensação de urgência que nunca desliga',
  'Ansiedade por tarefas acumuladas',
  'Dificuldade em manter foco por mais de 30 minutos',
  'Ciclo silencioso: culpa → procrastinação → frustração',
];

/**
 * R19.7 — Motivae premium page on the frozen design system.
 * All copy preserved verbatim; SEO props, routes and tracking untouched.
 */
const MotivaeLanding = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;

  return (
    <Layout>
      <ScrollDepth location="motivae" />
      <SEO
        title="Motivae — Produtividade Emocional com IA | Getboost Digital"
        description="Plataforma de produtividade emocional que combina IA e psicologia leve para ajudar pessoas a viver com clareza, foco e direção — sem pressão."
        canonical="/motivae"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, rgba(250,247,241,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Motivae · Produtividade Emocional · IA Humana</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="ed-display mt-6 text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]"
              >
                {manifestoLines[0]}{' '}
                <em style={{ color: 'var(--gb-ai-strong)' }}>{manifestoLines[1]}</em>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                A Motivae é a plataforma de produtividade emocional que combina IA, psicologia leve e design humano. Um espaço seguro onde entendes o que sentes, organizas a mente e crias rotinas que respeitam o teu ritmo — sem pressão, sem culpa, sem burnout.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button size="lg" onClick={() => setContactOpen(true)}>
                  Entrar na beta
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('motivae_hero', 'motivae_booking', 'consideration')}>
                    Ver como funciona
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['Coach IA', 'Check-in diário', 'Hábitos saudáveis', 'Privacidade total'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div style={{ y: reduceMotion ? 0 : clusterY }} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                  transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="gb-card !p-6 !shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="gb-eyebrow text-ink-tertiary">Coach IA emocional</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        Online
                      </span>
                    </div>
                    <MiniFlow
                      steps={['Check-in', 'Coach IA', 'Plano leve', 'Rotina', 'Evolução']}
                      tint="var(--gb-ai-tint)"
                      strong="var(--gb-ai-strong)"
                    />
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-black/[0.06] pt-4 text-center">
                      {beneficios.map((s) => (
                        <div key={s.k} className="rounded-xl bg-black/[0.03] px-2 py-3">
                          <div className="text-base font-extrabold tracking-tight text-ink-primary">{s.k}</div>
                          <div className="mt-1 text-[11px] font-medium text-ink-tertiary">{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== 02 PROBLEMA */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O problema"
            title="Vives em piloto automático?"
            description="A sobrecarga mental não se resolve com mais uma app de tarefas."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {problemas.map((p, i) => (
              <Reveal key={p} i={i % 3}>
                <div className="gb-card h-full opacity-90">
                  <div className="flex items-start gap-3 text-[15px] text-ink-secondary">
                    <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--gb-ai-base)' }} />
                    {p}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal i={0}>
            <div className="gb-card gb-card-lift mt-6" style={{ ['--gb-glow' as string]: 'var(--gb-ai-glow)' }}>
              <MiniFlow
                steps={['Sobrecarga', 'Check-in', 'Clareza', 'Rotina leve', 'Evolução']}
                tint="var(--gb-ai-tint)"
                strong="var(--gb-ai-strong)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 03 CAPACIDADES */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O que a Motivae faz"
            title="Uma plataforma inteira desenhada à volta de como te sentes"
            description="Cinco capacidades que combinamos no teu ritmo — nunca pacotes fechados."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = [Brain, Heart, Check, Sparkles, ShieldCheck][i % 5] ?? Brain;
              return (
                <Reveal key={f.title} i={i % 3}>
                  <div className="gb-card gb-card-lift h-full !p-6">
                    <span
                      className="gb-icon-chip"
                      style={{ ['--gb-chip-bg' as string]: 'var(--gb-ai-tint)', ['--gb-chip-fg' as string]: 'var(--gb-ai-strong)' }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="gb-eyebrow mt-5" style={{ color: 'var(--gb-ai-strong)' }}>{f.eyebrow}</p>
                    <h3 className="gb-text-h3 mt-2 !text-xl text-ink-primary">{f.title}</h3>
                    <p className="gb-text-small mt-2 text-ink-secondary">{f.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {f.tags.map((tag) => (
                        <span key={tag} className="gb-chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== 04 PARA QUEM */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Para quem foi feita"
            title="Pensada para quem sente demasiado e organiza pouco"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paraQuem.map((p, i) => (
              <Reveal key={p} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <div className="font-mono text-sm tracking-[0.22em]" style={{ color: 'var(--gb-ai-strong)' }}>{String(i + 1).padStart(2, '0')}</div>
                  <p className="gb-text-h3 mt-4 !text-xl text-ink-primary">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal i={0}>
            <div className="gb-card mt-6 text-center">
              <p className="gb-text-h3 !text-2xl text-ink-primary">
                A Motivae não é mais uma app de produtividade. É a primeira plataforma onde o foco nasce da <span style={{ color: 'var(--gb-ai-strong)' }}>clareza interior</span> — não da pressão.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 05 PROVA */}
            {/* 10B CASOS — resultados de clientes (motor partilhado, sem conteúdo inventado) */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <CaseProofStrip
            slugs={['motivae']}
            tint="var(--gb-ai-tint)"
            strong="var(--gb-ai-strong)"
            trackingLocation="motivae_cases"
          />
        </div>
      </section>

<section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Resultados"
            title="O que muda quando o dia respeita o teu ritmo"
            description="Benefícios reportados por utilizadores da beta — sem métricas inventadas."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {beneficios.map((s, i) => (
              <Reveal key={s.k} i={i}>
                <div className="gb-surface-card-elevated h-full text-center">
                  <div className="gb-text-h2" style={{ color: 'var(--gb-ai-strong)' }}><CountUp value={s.k} /></div>
                  <p className="gb-text-small mt-2 text-ink-secondary">{s.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 06 FINAL CTA */}
            {/* OBJEÇÕES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Perguntas que ouvimos sempre"
            title="Dúvidas legítimas, respostas diretas"
            description="O que nos perguntam antes de avançar — respondido sem rodeios."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Reveal key="objecao-0" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Isto substitui acompanhamento psicológico?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não. A Motivae é produtividade emocional — organização, foco e rotinas. Para questões clínicas, procura sempre um profissional.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-1" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Os meus dados emocionais ficam expostos?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não: interface privada, linguagem humana e privacidade total — sem gamificação tóxica nem partilha.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-2" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quanto tempo ocupa por dia?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Um check-in curto por dia. Micro-passos em vez de maratonas — a rotina adapta-se à tua energia, nunca ao contrário.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-3" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">É grátis?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">A beta privada é gratuita: pede acesso e recebe convite prioritário para o Coach IA emocional.</p>
                </div>
              </Reveal>
          </div>
        </div>
      </section>

<section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, rgba(0,0,0,0) 65%)' }}
                animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }}
                transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Prontos para viver com mais <span style={{ color: '#ff4000' }}>clareza</span>?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Entra na beta privada da Motivae e recebe acesso antecipado ao Coach IA emocional.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button size="lg" onClick={() => setContactOpen((v) => !v)}>
                    {contactOpen ? 'Fechar formulário' : 'Pedir acesso à beta'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('motivae_cta', 'motivae_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <Zap className="h-4 w-4" />
                  ou faz a auditoria grátis de 7 min
                </button>
                <div className="mx-auto mt-10 max-w-3xl text-left">
                  <ConsultantContactForm
                    open={contactOpen}
                    service={{
                      slug: 'motivae',
                      name: 'Motivae',
                      accent: '#ff4000',
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
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        trackingSource="motivae"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default MotivaeLanding;