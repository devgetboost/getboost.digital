import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { resources } from '@/data/resources';
import ResourceCard from '@/components/ResourceCard';

const ACCENT = '#ff4000';

const Resources = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'guides' | 'templates' | 'tools'>('all');
  const filters = ['all', 'guides', 'templates', 'tools'] as const;
  const filtered = filter === 'all' ? resources : resources.filter((r) => r.category === filter);

  return (
    <Layout>
      <SEO
        title={`${t('resources.title')} — ${t('resources.heroBadge')}`}
        description={t('resources.heroSubtitle')}
        canonical="/resources"
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
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            {t('resources.heroBadge')} · Guias · Templates · Ferramentas
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.5rem,7vw,6rem)]">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="block"
            >
              {t('resources.heroTitle')}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.27 }}
              className="block"
              style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}
            >
              {t('resources.heroHighlight')}
            </motion.span>
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
            {t('resources.heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[t('resources.checkFree'), t('resources.checkImmediate'), t('resources.checkReady')].map((c, i) => (
              <div key={i} className="flex items-center gap-3 border border-white/10 bg-white/[0.03] rounded-xl px-5 py-4">
                <FileText className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/70">{c}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: `${resources.length}`, v: 'Recursos disponíveis' },
              { k: '100%', v: 'Grátis · sem cartão' },
              { k: 'PDF', v: 'Ready-to-use' },
              { k: '<1min', v: 'Download imediato' },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LISTING */}
      <section className="bg-[#0a0603] text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-12 border-b border-white/10 pb-8">
            {filters.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-[0.18em] border transition-all ${
                    active
                      ? 'bg-[#ff4000] text-white border-[#ff4000]'
                      : 'bg-transparent text-white/60 border-white/15 hover:border-[#ff4000]/50 hover:text-white'
                  }`}
                >
                  {t(`resources.filters.${f}`)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((resource, i) => (
              <ResourceCard key={resource.id} resource={resource} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-white/50 font-mono text-sm uppercase tracking-[0.22em]">
              Sem recursos nesta categoria.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Precisas de algo mais específico?
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-4 font-black leading-[0.98] tracking-tight text-[clamp(2rem,6vw,4.5rem)]"
          >
            Vamos desenhar uma <span style={{ color: ACCENT }}>estratégia à medida</span>.
          </motion.h2>
          <p className="text-white/60 mt-6 max-w-2xl mx-auto">
            Estes recursos abrem caminho — mas cada negócio tem contornos únicos. Marca uma conversa e traçamos juntos os próximos passos.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/booking"
              className="inline-flex items-center gap-3 border-2 px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Marcar reunião
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/solucoes"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors"
            >
              Ver todas as soluções
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Resources;
