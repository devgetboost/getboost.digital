import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Clock, PlayCircle, Award, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { supabase } from '@/integrations/supabase/client';

const ACCENT = '#ff4000';
const ACADEMY_URL = 'https://getboost.digital/academy';

const manifestoLines = ['Aprende hoje.', 'Escala amanhã.'];

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
  price_label: string | null;
  cover_image: string | null;
  tags: string[] | null;
  outcomes: string[] | null;
  external_url: string | null;
  is_featured: boolean;
};

const Academy = () => {
  const { i18n } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      setCourses((data ?? []) as Course[]);
      setLoading(false);
    })();
  }, []);

  const goto = (c: Course) => `/academy/${c.slug}`;

  return (
    <Layout>
      <ScrollDepth location="academy" />
      <SEO
        title="Getboost Academy — Cursos e Formações | Getboost Digital"
        description="Formações práticas em Inteligência Artificial, Automação, Growth Marketing e Desenvolvimento. Aprende com quem opera. Aplica no dia seguinte."
        canonical="/academy"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 gb-grid-overlay opacity-[0.05]"
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
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(255,255,255,0) 65%)' }}
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
            Getboost Academy · Formação Prática · Aplica no dia seguinte
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
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-ink-secondary"
          >
            Não te ensinamos <em className="not-italic text-ink-primary">teoria</em>. Ensinamos-te a operar.
            Formações desenhadas por quem constrói agentes de IA, automações e campanhas de performance
            todos os dias. Cada aula tem um output prático. Cada curso, um projecto real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <a
              href={ACADEMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-ink-primary"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Entrar na Academy
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              to="/academy/formacao-empresas"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
              Formação à medida para equipas
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/10 pt-8"
          >
            {[
              { k: '100%', v: 'Prático e aplicado' },
              { k: '1:1', v: 'Mentoria opcional' },
              { k: 'PT', v: 'Formadores nativos' },
              { k: '∞', v: 'Acesso vitalício' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink-tertiary">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COURSES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <div className="flex items-end justify-between gap-6 border-t border-black/10 pt-10 mb-14">
            <div>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Catálogo · {courses.length} {courses.length === 1 ? 'formação' : 'formações'}
              </span>
              <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight max-w-3xl">
                Cursos desenhados para <span style={{ color: ACCENT }}>operar</span>, não para decorar CVs.
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-ink-tertiary font-mono text-xs uppercase tracking-[0.22em]">
              A carregar formações…
            </div>
          ) : courses.length === 0 ? (
            <div className="py-20 text-center text-ink-tertiary font-mono text-xs uppercase tracking-[0.22em]">
              Novas formações em breve.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.4) }}
                >
                <Link
                  to={goto(c)}
                  className="group relative flex flex-col overflow-hidden border border-black/10 bg-black/[0.02] transition-all hover:border-[#ff4000]/60 hover:bg-black/[0.04] h-full"
                >
                  {c.is_featured && (
                    <span
                      className="absolute right-4 top-4 z-10 font-mono text-[10px] uppercase tracking-[0.22em] px-2 py-1 border"
                      style={{ borderColor: ACCENT, color: ACCENT, background: 'rgb(28 25 23 / 0.8)' }}
                    >
                      Destaque
                    </span>
                  )}

                  <div className="relative aspect-[16/9] overflow-hidden bg-black">
                    {c.cover_image ? (
                      <img
                        src={c.cover_image}
                        alt={c.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
                          backgroundSize: '32px 32px',
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-primary via-transparent to-transparent" />
                    <div className="absolute left-5 bottom-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-secondary">
                      <GraduationCap className="h-4 w-4" style={{ color: ACCENT }} />
                      {c.category ?? 'Formação'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-6 md:p-7 flex-1">
                    <h3 className="text-xl md:text-2xl font-bold leading-tight tracking-tight">
                      {c.title}
                    </h3>
                    {c.subtitle && (
                      <p className="text-sm text-ink-secondary leading-relaxed">{c.subtitle}</p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-4 pt-4 border-t border-black/10 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-tertiary">
                      {c.level && <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />{c.level}</span>}
                      {c.duration && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{c.duration}</span>}
                      {c.lessons ? <span className="flex items-center gap-1.5"><PlayCircle className="h-3.5 w-3.5" />{c.lessons} aulas</span> : null}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold" style={{ color: ACCENT }}>
                        {c.price_label ?? 'Sob consulta'}
                      </span>
                      <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-secondary group-hover:text-ink-primary transition-colors">
                        Ver curso
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="gb-surface-page gb-section">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Prontos para <span style={{ color: ACCENT }}>subir de nível</span>?
          </motion.h2>
          <p className="mt-8 max-w-2xl mx-auto text-ink-secondary text-lg">
            Aceder à plataforma completa da Getboost Academy — trilhas, aulas, certificados e comunidade.
          </p>
          <div className="mt-14">
            <a
              href={ACADEMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-ink-primary"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Ir para getboost.digital/academy
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Academy;
