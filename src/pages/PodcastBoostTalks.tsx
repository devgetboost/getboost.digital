import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Mic, Headphones, Radio, Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { supabase } from '@/integrations/supabase/client';

const ACCENT = '#ff4000';

const manifestoLines = ['Menos ruído.', 'Mais sinal.'];

type Episode = {
  id: string;
  episode_number: number | null;
  title: string;
  eyebrow: string | null;
  description: string | null;
  tags: string[];
  audio_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
};

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

const PodcastBoostTalks = () => {
  const { i18n } = useTranslation();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signedCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('podcast_episodes')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      setEpisodes((data as Episode[]) || []);
      setLoading(false);
    })();
  }, []);

  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (signedCache.current.has(path)) return signedCache.current.get(path)!;
    const { data } = await supabase.storage.from('podcast-audio').createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      signedCache.current.set(path, data.signedUrl);
      return data.signedUrl;
    }
    return null;
  };

  const playIdx = async (idx: number) => {
    const ep = episodes[idx];
    if (!ep?.audio_url) return;
    const url = await getSignedUrl(ep.audio_url);
    if (!url) return;
    if (!audioRef.current) return;
    if (currentIdx !== idx) {
      audioRef.current.src = url;
      setCurrentIdx(idx);
      setProgress(0);
    }
    audioRef.current.play();
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (currentIdx === -1) {
      const firstWithAudio = episodes.findIndex((e) => e.audio_url);
      if (firstWithAudio >= 0) playIdx(firstWithAudio);
      return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const nextEp = () => {
    for (let i = currentIdx + 1; i < episodes.length; i++) {
      if (episodes[i].audio_url) return playIdx(i);
    }
  };
  const prevEp = () => {
    for (let i = currentIdx - 1; i >= 0; i--) {
      if (episodes[i].audio_url) return playIdx(i);
    }
  };

  const currentEp = currentIdx >= 0 ? episodes[currentIdx] : null;

  return (
    <Layout>
      <SEO
        title="Podcast BoostTalks — Conversas sobre Crescimento e IA | Getboost Digital"
        description="BoostTalks é o podcast da Getboost Digital: episódios sem filtros sobre marketing, tecnologia, agentes de IA e o futuro dos negócios digitais."
        canonical="/podcast"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={() => { setPlaying(false); nextEp(); }}
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
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
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
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            BoostTalks · Podcast · Novos episódios quinzenais
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.75rem,8vw,7rem)]">
            {manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === manifestoLines.length - 1 ? (
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>{line}</span>
                ) : line}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 h-px w-40 origin-left" style={{ background: `${ACCENT}b3` }}
          />

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
          >
            <em className="not-italic text-white">BoostTalks</em> é o podcast onde falamos do que
            realmente move negócios em Portugal — estratégia, tecnologia, IA aplicada, vendas e
            marca. Conversas longas, honestas, com quem constrói e opera.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={togglePlay}
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Pausar' : 'Ouvir agora'}
            </button>
            <a
              href="#episodios"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Headphones className="h-4 w-4" style={{ color: ACCENT }} />
              Ver playlist
            </a>
          </motion.div>
        </div>
      </section>

      {/* PLAYLIST */}
      <section id="episodios" className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="mb-12 flex items-center gap-4">
            <Radio className="h-5 w-5" style={{ color: ACCENT }} />
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/60">
              Playlist · {episodes.length} {episodes.length === 1 ? 'episódio' : 'episódios'}
            </span>
          </div>

          {loading && (
            <p className="text-white/50 py-12 text-center font-mono text-sm">A carregar…</p>
          )}

          {!loading && episodes.length === 0 && (
            <div className="border border-white/10 rounded-lg p-12 text-center">
              <Mic className="h-10 w-10 mx-auto mb-4 text-white/30" />
              <p className="text-white/60">Ainda sem episódios publicados. Volta em breve.</p>
            </div>
          )}

          <div className="border-t border-white/10">
            {episodes.map((ep, i) => {
              const isCurrent = currentIdx === i;
              const hasAudio = !!ep.audio_url;
              return (
                <div
                  key={ep.id}
                  className={`border-b border-white/10 grid grid-cols-[auto_1fr_auto] gap-4 md:gap-6 py-5 md:py-6 items-center transition-colors ${
                    isCurrent ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => hasAudio && (isCurrent && playing ? (audioRef.current?.pause(), setPlaying(false)) : playIdx(i))}
                    disabled={!hasAudio}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-full border-2 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                    style={{ borderColor: ACCENT, color: isCurrent && playing ? '#0a0603' : ACCENT, background: isCurrent && playing ? ACCENT : 'transparent' }}
                    aria-label={isCurrent && playing ? 'Pausar' : 'Reproduzir'}
                  >
                    {isCurrent && playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>

                  <div className="min-w-0">
                    {ep.eyebrow && (
                      <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.22em] mb-1"
                        style={{ color: isCurrent ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                        {ep.eyebrow}
                      </div>
                    )}
                    <h3 className="text-lg md:text-2xl font-bold leading-tight truncate">
                      {ep.episode_number != null && (
                        <span className="text-white/40 mr-2 font-mono">#{String(ep.episode_number).padStart(2, '0')}</span>
                      )}
                      {ep.title}
                    </h3>
                    {ep.description && (
                      <p className="mt-2 text-sm text-white/60 line-clamp-2 hidden md:block">{ep.description}</p>
                    )}
                    {ep.tags.length > 0 && (
                      <div className="mt-3 hidden md:flex flex-wrap gap-2">
                        {ep.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] text-white/60">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="font-mono text-xs md:text-sm text-white/50 tabular-nums">
                    {ep.duration_seconds ? fmt(ep.duration_seconds) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STICKY PLAYER */}
      <AnimatePresence>
        {currentEp && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0603] border-t border-white/15 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.6)]"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button onClick={prevEp} className="text-white/70 hover:text-white p-1" aria-label="Anterior">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                  style={{ background: ACCENT, color: '#0a0603' }}
                  aria-label={playing ? 'Pausar' : 'Reproduzir'}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <button onClick={nextEp} className="text-white/70 hover:text-white p-1" aria-label="Seguinte">
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-white text-sm font-semibold truncate">{currentEp.title}</div>
                  <div className="font-mono text-[10px] text-white/50 tabular-nums shrink-0">
                    {fmt(progress)} / {fmt(duration || currentEp.duration_seconds || 0)}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  value={progress}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = v;
                    setProgress(v);
                  }}
                  className="w-full mt-1 h-1 accent-[#ff4000] cursor-pointer"
                />
              </div>

              <Volume2 className="h-4 w-4 text-white/40 hidden md:block" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA FINAL */}
      <section className="bg-black text-white py-28 md:py-40 pb-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Tens uma história que <span style={{ color: ACCENT }}>merece</span> ser{' '}
            <span style={{ color: ACCENT }}>contada</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
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
              {contactOpen ? 'Fechar formulário' : 'Quero participar'}
              <Mic className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'podcast-boosttalks',
              name: 'Podcast BoostTalks',
              accent: ACCENT,
              eyebrow: 'Candidatura · BoostTalks',
              headline: 'Conta-nos a tua história.',
              subhead: 'Diz-nos quem és, o que constróis e que tema traria mais valor à audiência.',
              goalOptions: [
                'Sou fundador/CEO e quero partilhar caso real',
                'Trabalho em growth, produto ou vendas',
                'Sou especialista em IA/tecnologia',
                'Quero sugerir um convidado',
                'Sou marca e quero patrocinar',
              ],
              messagePlaceholder: 'Tema proposto, principais aprendizagens, contexto do teu negócio…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default PodcastBoostTalks;
