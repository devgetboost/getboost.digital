import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, ArrowRight, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';

const ACCENT = '#ff4000';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  read_time: string;
  featured: boolean;
  created_at: string;
};

const Blog = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPath = useMemo(() => location.pathname, [location.pathname]);
  const dateLocale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'en' ? 'en-GB' : 'pt-PT';

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, category, image, read_time, featured, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const categories = ['all', ...Array.from(new Set(posts.map((p) => p.category)))];
  const filtered = posts
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const featured = posts.find((p) => p.featured);
  const showFeatured = featured && category === 'all' && !search;
  const rest = showFeatured ? filtered.filter((p) => p.id !== featured!.id) : filtered;

  return (
    <Layout>
      <SEO
        title={`${t('blog.title')} — Marketing Digital, SEO & IA`}
        description={t('blog.heroSubtitle')}
        canonical={currentPath}
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO — manifesto style */}
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
            Blog & Insights · Marketing · IA · SEO
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.5rem,7vw,6rem)]">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="block"
            >
              {t('blog.heroTitle')}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.27 }}
              className="block"
              style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}
            >
              {t('blog.heroHighlight')}
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
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs md:text-sm text-white/70"
              >
                {f}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LISTING — dark canvas */}
      <section className="bg-[#0a0603] text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-12 border-b border-white/10 pb-8">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder={t('blog.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/15 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff4000]/60 transition-colors"
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
                        ? 'bg-[#ff4000] text-white border-[#ff4000]'
                        : 'bg-transparent text-white/60 border-white/15 hover:border-[#ff4000]/50 hover:text-white'
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
                    className="mb-20 group cursor-pointer border border-white/10 rounded-2xl overflow-hidden hover:border-[#ff4000]/50 transition-all"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      <div className="overflow-hidden aspect-[16/10] lg:aspect-auto lg:min-h-[420px]">
                        <img
                          src={featured!.image}
                          alt={featured!.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center p-8 md:p-12 bg-white/[0.02]">
                        <span
                          className="font-mono text-[11px] uppercase tracking-[0.22em]"
                          style={{ color: ACCENT }}
                        >
                          Featured · {featured!.category}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black mt-4 leading-[1.05] tracking-tight group-hover:text-[#ff4000] transition-colors">
                          {featured!.title}
                        </h2>
                        <p className="text-white/70 mt-4 leading-relaxed">{featured!.excerpt}</p>
                        <div className="flex items-center gap-4 mt-6 text-xs font-mono uppercase tracking-[0.18em] text-white/50">
                          <span>{new Date(featured!.created_at).toLocaleDateString(dateLocale)}</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {featured!.read_time}
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
                {rest.map((post, i) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="group cursor-pointer h-full border border-white/10 rounded-2xl overflow-hidden hover:border-[#ff4000]/50 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="overflow-hidden aspect-[16/10]">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-6">
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.22em]"
                          style={{ color: ACCENT }}
                        >
                          {post.category}
                        </span>
                        <h3 className="text-xl font-bold mt-3 leading-tight group-hover:text-[#ff4000] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-white/60 mt-3 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
                          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                            <span>{new Date(post.created_at).toLocaleDateString(dateLocale)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.read_time}
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
                ))}
              </div>

              {!loading && filtered.length === 0 && (
                <div className="text-center py-24 text-white/50 font-mono text-sm uppercase tracking-[0.22em]">
                  {t('blog.noResults')}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
