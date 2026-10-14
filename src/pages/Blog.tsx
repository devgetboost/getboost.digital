import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, ArrowRight, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { Button } from '@/components/ui/button';
import { analytics } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useContentEntriesWithFallback } from '@/hooks/useContent';
import { estimateReadingMinutes, mediaUrl } from '@/lib/contentApi';

const ACCENT = '#ff4000';

// R1C6: the page no longer defines its own row shape. `ContentEntryView` comes
// from the Clean V1 content layer and already carries the localized fields,
// the author and the category.

const Blog = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { entries, loading, fallback, resolvedMarket } = useContentEntriesWithFallback({
    contentType: 'insight',
  });
  const posts = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)),
    [entries],
  );
  const crossMarket = fallback === 'default';

  const currentPath = useMemo(() => location.pathname, [location.pathname]);
  const dateLocale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'en' ? 'en-GB' : 'pt-PT';

  const categories = [
    'all',
    ...Array.from(new Set(posts.map((p) => p.category?.name || p.category?.key || 'outros'))),
  ];
  const filtered = posts
    .filter((p) => category === 'all' || (p.category?.name || p.category?.key || 'outros') === category)
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const featured = posts.find((p) => p.featured);
  const featuredImage = featured ? mediaUrl(featured.coverMediaPath) : null;
  const featuredMinutes = featured ? estimateReadingMinutes(featured.body) : 1;
  const featuredDate = featured
    ? new Date(featured.publishedAt ?? featured.createdAt).toLocaleDateString(dateLocale)
    : '';
  const showFeatured = featured && category === 'all' && !search;
  const rest = showFeatured ? filtered.filter((p) => p.id !== featured!.id) : filtered;

  return (
    <Layout>
      <ScrollDepth location="blog" />
      <SEO
        title={`${t('blog.title')} — Marketing Digital, SEO & IA`}
        description={t('blog.heroSubtitle')}
        canonical={currentPath}
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO — manifesto style */}
      <section className="gb-surface-page relative overflow-hidden">
        
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(250,247,241,0) 65%)',
          }}
        />

        <div className="gb-container relative gb-section">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="gb-eyebrow text-brand-600"
            style={{ borderColor: `${ACCENT}66` }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Blog & Insights · Marketing · IA · SEO
          </motion.div>

          <h1 className="ed-display mt-6 text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="block"
            >
              {t('blog.heroTitle')}
            </motion.span>
            <em>{t('blog.heroHighlight')}</em>
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
            {t('blog.heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap gap-3"
          >
            {['SEO', t('blog.featureSocial'), 'Branding', t('blog.featureStrategy'), 'IA', 'Automação'].map((f) => (
              <span
                key={f}
                className="rounded-full border border-black/20 px-4 py-1.5 text-xs md:text-sm text-ink-secondary"
              >
                {f}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LISTING — dark canvas */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-12 border-b border-black/10 pb-8">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
              <input
                type="text"
                placeholder={t('blog.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/[0.03] border border-black/15 rounded-full pl-10 pr-4 py-2.5 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-[#ff4000]/60 transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-[0.18em] border transition-all ${
                      active
                        ? 'bg-[#ff4000] text-ink-primary border-[#ff4000]'
                        : 'bg-transparent text-ink-secondary border-black/15 hover:border-[#ff4000]/50 hover:text-ink-primary'
                    }`}
                  >
                    {c === 'all' ? t('blog.all') : c}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
            </div>
          ) : (
            <>
              {showFeatured && (
                <Link to={`/blog/${featured!.slug}`}>
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-20 group cursor-pointer border border-black/10 rounded-2xl overflow-hidden hover:border-[#ff4000]/50 transition-all"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      <div className="overflow-hidden aspect-[16/10] lg:aspect-auto lg:min-h-[420px]">
                        {featuredImage ? (
                          <img
                            src={featuredImage}
                            alt={featured!.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col justify-center p-8 md:p-12 bg-black/[0.02]">
                        <span
                          className="font-mono text-[11px] uppercase tracking-[0.22em]"
                          style={{ color: ACCENT }}
                        >
                          Featured · {featured!.category?.name || featured!.category?.key}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black mt-4 leading-[1.05] tracking-tight group-hover:text-[#ff4000] transition-colors">
                          {featured!.title}
                        </h2>
                        <p className="text-ink-secondary mt-4 leading-relaxed">{featured!.excerpt}</p>
                        <div className="flex items-center gap-4 mt-6 text-xs font-mono uppercase tracking-[0.18em] text-ink-tertiary">
                          <span>{featuredDate}</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {t('blog.readTime', { minutes: featuredMinutes })}
                          </span>
                        </div>
                        <span
                          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] mt-8"
                          style={{ color: ACCENT }}
                        >
                          {t('blog.readMore')}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map((post, i) => {
                  const postImage = mediaUrl(post.coverMediaPath);
                  const postMinutes = estimateReadingMinutes(post.body);
                  return (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="group cursor-pointer h-full border border-black/10 rounded-2xl overflow-hidden hover:border-[#ff4000]/50 hover:bg-black/[0.02] transition-all"
                    >
                      <div className="overflow-hidden aspect-[16/10]">
                        {postImage ? (
                          <img
                            src={postImage}
                            alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        ) : null}
                      </div>
                      <div className="p-6">
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.22em]"
                          style={{ color: ACCENT }}
                        >
                          {post.category?.name || post.category?.key}
                        </span>
                        <h3 className="text-xl font-bold mt-3 leading-tight group-hover:text-[#ff4000] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-ink-secondary mt-3 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-black/10">
                          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-tertiary">
                            <span>{new Date(post.createdAt).toLocaleDateString(dateLocale)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t('blog.readTime', { minutes: postMinutes })}
                            </span>
                          </div>
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            style={{ color: ACCENT }}
                          />
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                  );
                })}
              </div>

              {crossMarket && (
                <div className="mb-8 border border-warning/30 bg-warning-bg rounded-lg p-4 text-sm text-warning">
                  {t('blog.notLocalized', 'Este conteúdo ainda não está traduzido para o teu mercado. Mostramos a versão original.')}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-24 text-ink-tertiary font-mono text-sm uppercase tracking-[0.22em]">
                  {t('blog.noResults')}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA — every reader gets a commercial next step */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
            <div className="relative">
              <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                Gostas do que lês? <span style={{ color: '#ff4000' }}>Aplica-o</span> ao teu negócio.
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Diagnóstico gratuito de 30 minutos — saís com um plano concreto.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/booking" onClick={() => analytics.trackClick('blog', 'blog_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                  <Link to="/contact" onClick={() => analytics.trackClick('blog', 'blog_contact', 'consideration')}>
                    Falar com Especialista
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
