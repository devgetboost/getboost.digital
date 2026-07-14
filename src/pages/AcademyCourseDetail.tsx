import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Target,
  Users,
  Zap,
  BookOpen,
  Compass,
  Rocket,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';

const ACCENT = '#ff4000';

type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  level: string | null;
  duration: string | null;
  lessons: number | null;
  price: number | null;
  price_label: string | null;
  cover_image: string | null;
  tags: string[] | null;
  outcomes: string[] | null;
  external_url: string | null;
  is_featured: boolean;
};

const FALLBACK_OUTCOMES = [
  'Aplicar as ferramentas em cenários reais da tua operação',
  'Construir entregáveis prontos a usar até ao final de cada módulo',
  'Reduzir tempo de execução em tarefas críticas do dia-a-dia',
  'Ter um plano concreto para escalar o que aprendeste',
];

const buildModules = (course: Course) => {
  const base = [
    {
      icon: Compass,
      title: 'Fundamentos e diagnóstico',
      summary:
        'Contexto, vocabulário e um mapa claro do problema. Sais desta fase com uma leitura afiada do teu ponto de partida.',
      bullets: [
        'Onde estás hoje vs. onde queres chegar',
        'As 3 alavancas que fazem diferença real',
        'Ferramentas essenciais (sem inflar o stack)',
      ],
    },
    {
      icon: BookOpen,
      title: 'Estratégia e arquitectura',
      summary:
        'Desenhamos o plano. Estrutura, prioridades e critérios de decisão para não te perderes no meio do caminho.',
      bullets: [
        'Framework de decisão passo a passo',
        'Templates prontos a adaptar',
        'Checklist para validar cada escolha',
      ],
    },
    {
      icon: Zap,
      title: 'Execução prática',
      summary:
        'Mãos na massa. Constróis, testas, quebras e reconstróis. Cada aula termina com um output que fica contigo.',
      bullets: [
        'Workshops guiados com exemplos reais',
        'Erros comuns e como evitá-los',
        'Revisão em tempo real dos entregáveis',
      ],
    },
    {
      icon: Rocket,
      title: 'Escala e optimização',
      summary:
        'Passar do protótipo à operação. Métricas, automação e como transformar o que aprendeste num sistema.',
      bullets: [
        'Métricas que importam (e as que não)',
        'Automação de tarefas repetitivas',
        'Roadmap para os próximos 90 dias',
      ],
    },
  ];
  return base;
};

const FAQS = [
  {
    q: 'Preciso de conhecimentos prévios?',
    a: 'Não. Começamos pelos fundamentos e subimos o nível de forma gradual. Se já tens experiência, os módulos avançados dão-te profundidade e frameworks novos.',
  },
  {
    q: 'Como é a dinâmica das aulas?',
    a: 'Cada aula tem uma parte curta de conceito e uma parte longa de prática. No final, sais com um entregável real — não apenas notas.',
  },
  {
    q: 'Tenho acesso vitalício aos conteúdos?',
    a: 'Sim. O acesso é vitalício e inclui todas as actualizações futuras do curso.',
  },
  {
    q: 'Posso pedir mentoria individual?',
    a: 'Sim. Adicionamos sessões 1:1 com o formador em qualquer momento — presencial ou online.',
  },
  {
    q: 'Existe factura e certificado?',
    a: 'Emitimos factura para empresa ou particular e certificado de conclusão com carga horária discriminada.',
  },
];

const AcademyCourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [related, setRelated] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (!data) {
        setLoading(false);
        return;
      }
      setCourse(data as Course);
      const { data: rel } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_published', true)
        .neq('id', data.id)
        .order('sort_order', { ascending: true })
        .limit(3);
      setRelated((rel ?? []) as Course[]);
      setLoading(false);
    })();
  }, [slug]);

  const modules = useMemo(() => (course ? buildModules(course) : []), [course]);
  const outcomes = useMemo(
    () => (course?.outcomes && course.outcomes.length ? course.outcomes : FALLBACK_OUTCOMES),
    [course]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim() || null,
        source: `academy:${course.slug}`,
        landing_page: `/academy/${course.slug}`,
      });
      if (error) throw error;
      analytics.trackForm('academy', `academy_course_${course.slug}_success`, {
        course: course.slug,
        email: form.email.trim(),
      });
      toast({
        title: 'Inscrição enviada',
        description: 'Recebemos o teu pedido. Entramos em contacto em menos de 24h.',
      });
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Não foi possível enviar', description: 'Tenta novamente daqui a instantes.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0a0603] flex items-center justify-center">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/40">A carregar formação…</div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0a0603] text-white flex flex-col items-center justify-center gap-6 px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Formação não encontrada
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-center">Este curso já não está disponível.</h1>
          <button
            onClick={() => navigate('/academy')}
            className="inline-flex items-center gap-2 border-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.24em]"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar à Academy
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`${course.title} — Getboost Academy`}
        description={course.subtitle || course.description || 'Formação prática Getboost Academy.'}
        canonical={`/academy/${course.slug}`}
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
            maskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/3 h-[640px] w-[640px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-24 md:pt-24 md:pb-32">
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Academy · {course.category ?? 'Formação'}
          </Link>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1.3fr,1fr] gap-14 items-start">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
                style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                {course.is_featured ? 'Formação em destaque' : 'Turma em captação'}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-8 font-black leading-[0.95] tracking-tight text-[clamp(2.5rem,6vw,5.5rem)]"
              >
                {course.title.split(' ').slice(0, -1).join(' ')}{' '}
                <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>
                  {course.title.split(' ').slice(-1)[0]}
                </span>
              </motion.h1>

              {course.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
                >
                  {course.subtitle}
                </motion.p>
              )}

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 h-px w-40 origin-left"
                style={{ background: `${ACCENT}b3` }}
              />

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
                {course.level && (
                  <span className="inline-flex items-center gap-2">
                    <Award className="h-4 w-4" style={{ color: ACCENT }} /> {course.level}
                  </span>
                )}
                {course.duration && (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: ACCENT }} /> {course.duration}
                  </span>
                )}
                {course.lessons ? (
                  <span className="inline-flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" style={{ color: ACCENT }} /> {course.lessons} aulas
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: ACCENT }} /> Turmas reduzidas
                </span>
              </div>
            </div>

            {/* Enrollment card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8"
            >
              <div className="absolute inset-x-0 -top-px h-px" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Investimento</span>
              </div>
              <div className="mt-3 text-4xl md:text-5xl font-black tracking-tight" style={{ color: ACCENT }}>
                {course.price_label ?? (course.price ? `${course.price} €` : 'Sob consulta')}
              </div>
              <p className="mt-3 text-sm text-white/60">
                Reserva de lugar. Após enviares o pedido, confirmamos disponibilidade e formas de pagamento em menos de 24h.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <input
                  type="text"
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4000] focus:outline-none transition-colors"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4000] focus:outline-none transition-colors"
                  required
                />
                <input
                  type="tel"
                  placeholder="Telemóvel (opcional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4000] focus:outline-none transition-colors"
                />
                <textarea
                  placeholder="Conta-nos o teu contexto (opcional)"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4000] focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-3 border-2 px-6 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-50"
                  style={{ borderColor: ACCENT, color: '#ffb494' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {submitting ? 'A enviar…' : 'Quero inscrever-me'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 text-center">
                  Resposta em menos de 24h · Sem compromisso
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* INFO BAR */}
      <section className="relative bg-[#0a0603] text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { label: 'Início', value: '9 Out, 2026' },
              { label: 'Fim', value: '15 Out, 2026' },
              { label: 'Duração', value: course.duration ?? '20 horas' },
              { label: 'Investimento', value: course.price_label ?? (course.price ? `${course.price} €` : 'Sob consulta') },
              { label: 'Horários', value: 'Seg a Sex · 19h–23h' },
            ].map((item) => (
              <div key={item.label} className="p-6 md:p-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  {item.label}
                </div>
                <div className="mt-3 text-lg md:text-xl font-semibold tracking-tight text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCHEDULE + INCLUDES */}
      <section className="bg-[#0a0603] text-white py-20 md:py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Calendário semanal
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight max-w-3xl">
            Cinco noites, <span style={{ color: ACCENT }}>uma semana</span>, um novo skill.
          </h2>

          <div className="mt-10 grid grid-cols-4 md:grid-cols-7 gap-3">
            {[
              { day: 'Seg', active: true },
              { day: 'Ter', active: true },
              { day: 'Qua', active: true },
              { day: 'Qui', active: true },
              { day: 'Sex', active: true },
              { day: 'Sáb', active: false },
              { day: 'Dom', active: false },
            ].map((d) => (
              <div
                key={d.day}
                className={
                  d.active
                    ? 'relative aspect-square border-b-2 bg-black flex flex-col justify-between p-4 md:p-5'
                    : 'relative aspect-square border border-white/5 bg-white/[0.02] flex flex-col justify-between p-4 md:p-5'
                }
                style={d.active ? { borderColor: ACCENT } : undefined}
              >
                <span
                  className={
                    d.active
                      ? 'text-3xl md:text-4xl font-black tracking-tight'
                      : 'text-3xl md:text-4xl font-black tracking-tight text-white/20'
                  }
                  style={d.active ? { color: ACCENT } : undefined}
                >
                  {d.day}
                </span>
                {d.active && (
                  <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.18em] text-white/60">
                    19h–23h
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-white/50">
            Sessões ao vivo · gravadas e disponíveis depois de cada aula.
          </p>

          {/* Includes */}
          <div className="mt-16">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">
              O que inclui a formação:
            </h3>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { k: course.duration ?? '20h', v: 'ao vivo, em remoto' },
                { k: course.lessons ? String(course.lessons) : '5', v: 'módulos práticos' },
                { k: '1', v: 'projeto final' },
              ].map((item) => (
                <div
                  key={item.v}
                  className="border border-white/10 bg-white/[0.02] p-8 md:p-10 hover:border-[#ff4000]/60 transition-colors"
                >
                  <div className="text-5xl md:text-6xl font-black tracking-tight" style={{ color: ACCENT }}>
                    {item.k}
                  </div>
                  <div className="mt-4 text-sm md:text-base text-white/60">{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* MANIFESTO / DESCRIPTION */}
      {course.description && (
        <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Sobre esta formação
            </span>
            <h2 className="mt-6 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight max-w-3xl">
              Uma abordagem <span style={{ color: ACCENT }}>directa</span>, sem preencher horas com teoria.
            </h2>
            <p className="mt-10 text-lg md:text-xl leading-relaxed text-white/75 whitespace-pre-line">
              {course.description}
            </p>
          </div>
        </section>
      )}

      {/* OUTCOMES */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.4fr] gap-14">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                O que sais a saber fazer
              </span>
              <h2 className="mt-6 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">
                Resultados <span style={{ color: ACCENT }}>concretos</span>, não certificados de parede.
              </h2>
              <p className="mt-8 text-white/60 leading-relaxed">
                Cada objectivo abaixo é medido por um entregável real. Se não conseguires fazê-lo até ao fim do módulo, revemos contigo — em 1:1 — até dominares.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outcomes.map((o, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
                  className="border border-white/10 bg-white/[0.02] p-6 flex gap-4"
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-1" style={{ color: ACCENT }} />
                  <p className="text-sm md:text-base leading-relaxed text-white/85">{o}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between gap-6 border-t border-white/10 pt-10 mb-14">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Currículo · {modules.length} módulos
              </span>
              <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight max-w-3xl">
                O caminho, do <span style={{ color: ACCENT }}>zero</span> ao operacional.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
                  className="group relative border border-white/10 bg-white/[0.02] p-8 hover:border-[#ff4000]/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="h-12 w-12 rounded-full border flex items-center justify-center"
                      style={{ borderColor: `${ACCENT}66` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                    </div>
                    <span className="font-mono text-4xl font-black leading-none text-white/10 group-hover:text-white/20 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-bold tracking-tight">{m.title}</h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{m.summary}</p>
                  <ul className="mt-6 space-y-2.5">
                    {m.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm text-white/75">
                        <span
                          className="mt-2 h-1 w-1 flex-shrink-0 rounded-full"
                          style={{ background: ACCENT }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {[
            {
              icon: Target,
              title: 'Para quem opera',
              body: 'Founders, marketers e product people que precisam de resultados esta semana — não em seis meses.',
            },
            {
              icon: Users,
              title: 'Para equipas',
              body: 'Formação in-company adaptada ao teu stack, aos teus KPIs e aos casos reais da tua operação.',
            },
            {
              icon: Sparkles,
              title: 'Para quem começa',
              body: 'Se estás a mudar de área ou a lançar o teu primeiro projecto, damos-te a fundação sem enrolação.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t border-white/10 pt-8">
              <Icon className="h-7 w-7" style={{ color: ACCENT }} />
              <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-white/60 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Perguntas frequentes
          </span>
          <h2 className="mt-6 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">
            As dúvidas <span style={{ color: ACCENT }}>reais</span>, respondidas sem rodeios.
          </h2>

          <Accordion type="single" collapsible className="mt-12">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline hover:text-[#ff4000]">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 leading-relaxed text-base">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="bg-black text-white py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="border-t border-white/10 pt-10 mb-14">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Continua a aprender
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight max-w-3xl">
                Outras formações que fazem sentido a seguir.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((c) => (
                <Link
                  key={c.id}
                  to={`/academy/${c.slug}`}
                  className="group border border-white/10 bg-white/[0.02] p-6 hover:border-[#ff4000]/60 transition-colors flex flex-col"
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    <GraduationCap className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                    {c.category ?? 'Formação'}
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight">{c.title}</h3>
                  {c.subtitle && <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-2">{c.subtitle}</p>}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em]">
                    <span style={{ color: ACCENT }}>{c.price_label ?? 'Sob consulta'}</span>
                    <span className="inline-flex items-center gap-1.5 text-white/70 group-hover:text-white transition-colors">
                      Ver <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="bg-[#0a0603] text-white py-28 md:py-40 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]"
          >
            Reserva o teu <span style={{ color: ACCENT }}>lugar</span>.
          </motion.h2>
          <p className="mt-8 text-white/60 text-lg">
            Turmas reduzidas para garantir acompanhamento próximo. Assim que enviares o pedido, confirmamos disponibilidade em menos de 24h.
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Inscrever-me agora
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/academy/formacao-empresas"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
              Formação à medida para a minha equipa
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AcademyCourseDetail;
