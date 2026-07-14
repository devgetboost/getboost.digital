import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CalendarDays, Clock, MapPin, Users, Video, CheckCircle2, Ticket } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { getWebinarBySlug, formatWebinarDate, webinars } from '@/data/webinars';

const ACCENT = '#ff4000';

const WebinarDetail = () => {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const [contactOpen, setContactOpen] = useState(false);
  const w = slug ? getWebinarBySlug(slug) : undefined;

  if (!w) return <Navigate to="/webinars" replace />;

  const related = webinars.filter((x) => x.slug !== w.slug).slice(0, 2);

  return (
    <Layout>
      <SEO
        title={`${w.title} — ${w.format} | Getboost Digital`}
        description={w.tagline}
        canonical={`/webinars/${w.slug}`}
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
            background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <Link
            to="/webinars"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Todas as sessões
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            {w.format} · {w.location} · {w.language}
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,6vw,5rem)] max-w-4xl">
            {w.title}
          </h1>

          <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75">
            {w.tagline}
          </p>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-8 max-w-4xl">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <div className="text-xs uppercase tracking-widest text-white/50">Data</div>
                <div className="mt-1 text-sm font-medium">{formatWebinarDate(w.date)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <div className="text-xs uppercase tracking-widest text-white/50">Duração</div>
                <div className="mt-1 text-sm font-medium">{w.durationMin} min</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <div className="text-xs uppercase tracking-widest text-white/50">Formato</div>
                <div className="mt-1 text-sm font-medium">{w.location}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Ticket className="h-5 w-5 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <div className="text-xs uppercase tracking-widest text-white/50">Investimento</div>
                <div className="mt-1 text-sm font-medium">{w.price}</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Inscrever-me
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            {w.seats ? (
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
                <Users className="inline h-4 w-4 mr-2" style={{ color: ACCENT }} />
                {w.seats} vagas · confirma cedo
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* SUMMARY + LEARN */}
      <section className="bg-[#0a0603] text-white py-24 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          <div>
            <div
              className="font-mono text-[11px] uppercase tracking-[0.28em]"
              style={{ color: ACCENT }}
            >
              Sobre a sessão
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              O que vais levar contigo
            </h2>
            <p className="mt-6 text-white/75 leading-relaxed">{w.summary}</p>

            <div className="mt-10">
              <div className="text-xs uppercase tracking-widest text-white/50 mb-4">
                Para quem é
              </div>
              <div className="flex flex-wrap gap-2">
                {w.audience.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-white/25 px-4 py-1.5 text-sm text-white/80"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div
              className="font-mono text-[11px] uppercase tracking-[0.28em]"
              style={{ color: ACCENT }}
            >
              Aprendizagens
            </div>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">
              Sais desta sessão a saber
            </h3>
            <ul className="mt-8 space-y-4">
              {w.learn.map((l) => (
                <li key={l} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-white/85">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* AGENDA */}
      <section className="bg-[#0a0603] text-white pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10 pt-16">
            <div
              className="font-mono text-[11px] uppercase tracking-[0.28em]"
              style={{ color: ACCENT }}
            >
              Agenda
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Como se desenrola
            </h2>

            <ol className="mt-12 space-y-6">
              {w.agenda.map((item, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-[80px_1fr] md:grid-cols-[140px_1fr] gap-6 border-b border-white/10 pb-6"
                >
                  <div className="font-mono text-sm md:text-base" style={{ color: ACCENT }}>
                    {item.time}
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-semibold">{item.title}</div>
                    {item.body && (
                      <div className="mt-2 text-sm text-white/65 leading-relaxed">{item.body}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {w.requirements && w.requirements.length > 0 && (
              <div className="mt-16">
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.28em]"
                  style={{ color: ACCENT }}
                >
                  O que precisas de trazer
                </div>
                <ul className="mt-6 space-y-3">
                  {w.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-white/80">
                      <span
                        className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: ACCENT }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SPEAKER */}
      <section className="bg-[#0a0603] text-white pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/10 pt-16">
          <div
            className="font-mono text-[11px] uppercase tracking-[0.28em]"
            style={{ color: ACCENT }}
          >
            Facilitador
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center font-bold text-3xl"
              style={{ background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}66` }}
            >
              {w.speaker.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">{w.speaker.name}</div>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-white/60">
                {w.speaker.role}
              </div>
              <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">{w.speaker.bio}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + REGISTRATION */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]"
          >
            Reserva o teu lugar em{' '}
            <span style={{ color: ACCENT }}>{w.format.toLowerCase()}</span>.
          </motion.h2>
          <p className="mt-6 text-white/70 max-w-2xl mx-auto">
            {formatWebinarDate(w.date)} · {w.location} · {w.price}
          </p>

          <div className="mt-12">
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {contactOpen ? 'Fechar formulário' : 'Inscrever-me agora'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: `webinar-${w.slug}`,
              name: w.title,
              accent: ACCENT,
              eyebrow: `Inscrição · ${w.format}`,
              headline: `Inscreve-te em "${w.title}"`,
              subhead: `${formatWebinarDate(w.date)} · ${w.location} · ${w.price}. Enviamos-te confirmação e instruções no dia seguinte.`,
              goalOptions: [
                'Vou participar sozinho(a)',
                'Vou levar 2-3 colegas',
                'Quero inscrever a equipa toda',
                'Só quero receber o replay',
              ],
              messagePlaceholder: 'Empresa, cargo, número de participantes e alguma pergunta antecipada…',
            }}
          />
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="bg-[#0a0603] text-white py-24 md:py-28">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div
              className="font-mono text-[11px] uppercase tracking-[0.28em]"
              style={{ color: ACCENT }}
            >
              Também te pode interessar
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/webinars/${r.slug}`}
                  className="group border border-white/10 p-8 hover:border-white/40 transition-colors"
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">
                    {r.format} · {r.location}
                  </div>
                  <div className="mt-4 text-xl md:text-2xl font-bold group-hover:translate-x-1 transition-transform">
                    {r.title}
                  </div>
                  <div className="mt-3 text-sm text-white/70">{r.tagline}</div>
                  <div
                    className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em]"
                    style={{ color: ACCENT }}
                  >
                    Ver sessão <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default WebinarDetail;
