import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ArrowRight, Loader2, List } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { isHtmlContent } from '@/lib/markdown-to-html';
import BlogShareContact from '@/components/BlogShareContact';
import BlogComments from '@/components/BlogComments';
import DOMPurify from 'dompurify';

const ACCENT = '#ff4000';

type BlogPostType = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  category: string; image: string; read_time: string; featured: boolean;
  created_at: string; updated_at?: string; meta_description?: string; meta_title?: string;
};
type RelatedPost = Omit<BlogPostType, 'content'>;

const BlogPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const currentPath = useMemo(() => location.pathname, [location.pathname]);
  const dateLocale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'en' ? 'en-GB' : 'pt-PT';

  useEffect(() => {
    const fetchPost = async () => {
      let { data } = await supabase.from('blog_posts').select('*').eq('slug', id!).eq('status', 'published').maybeSingle();
      if (!data) {
        ({ data } = await supabase.from('blog_posts').select('*').eq('id', id!).eq('status', 'published').maybeSingle());
      }
      if (!data) { setNotFound(true); setLoading(false); return; }
      setPost(data);
      const { data: relatedData } = await supabase.from('blog_posts').select('id, slug, title, excerpt, category, image, read_time, featured, created_at').eq('status', 'published').neq('id', data.id).limit(3);
      setRelated(relatedData || []);
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0a0603]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
      </div>
    </Layout>
  );
  if (notFound || !post) return <Navigate to="/blog" replace />;

  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.meta_description || post.excerpt, image: post.image,
    datePublished: post.created_at, dateModified: post.updated_at || post.created_at,
    author: { '@type': 'Person', name: 'Getboost Digital' },
    publisher: { '@type': 'Organization', name: 'Getboost Digital — Marketing Digital & IA' },
  };

  const slugify = (text: string) => text.toLowerCase().replace(/[^\w\sà-ú]/gi, '').replace(/\s+/g, '-').replace(/-+$/, '');

  const extractTOC = (content: string) => {
    if (isHtmlContent(content)) {
      const matches: { level: number; text: string; id: string }[] = [];
      const regex = /<h([23])[^>]*>([^<]+)<\/h\1>/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        matches.push({ level: parseInt(m[1]), text: m[2], id: slugify(m[2]) });
      }
      return matches;
    }
    return content.split('\n').filter(line => line.startsWith('## ') || line.startsWith('### ')).map(line => {
      const level = line.startsWith('### ') ? 3 : 2;
      const text = line.replace(/^#{2,3}\s/, '');
      return { level, text, id: slugify(text) };
    });
  };

  const renderInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|> (.+))/g;
    let lastIndex = 0; let match; let keyIdx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) tokens.push(text.slice(lastIndex, match.index));
      if (match[2]) tokens.push(<strong key={keyIdx++} className="text-white font-semibold">{match[2]}</strong>);
      else if (match[3] && match[4]) tokens.push(<Link key={keyIdx++} to={match[4]} className="hover:underline font-medium" style={{ color: ACCENT }}>{match[3]}</Link>);
      else if (match[5]) tokens.push(<span key={keyIdx++}>{renderInline(match[5])}</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
    return tokens;
  };

  const renderContent = (content: string) => {
    if (isHtmlContent(content)) {
      let html = content;
      html = html.replace(/<h([23])([^>]*)>([^<]+)<\/h\1>/g, (_, level, attrs, text) => {
        return `<h${level}${attrs} id="${slugify(text)}">${text}</h${level}>`;
      });
      const safeHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      return <div className="blog-rich-content prose-invert" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
    }
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) { const text = line.replace('# ', ''); return <h2 key={i} id={slugify(text)} className="text-3xl md:text-4xl font-black mt-12 mb-6 tracking-tight text-white scroll-mt-24">{renderInline(text)}</h2>; }
      if (line.startsWith('## ')) { const text = line.replace('## ', ''); return <h2 key={i} id={slugify(text)} className="text-2xl md:text-3xl font-bold mt-12 mb-4 tracking-tight text-white scroll-mt-24">{renderInline(text)}</h2>; }
      if (line.startsWith('### ')) { const text = line.replace('### ', ''); return <h3 key={i} id={slugify(text)} className="text-xl font-semibold mt-8 mb-3 text-white scroll-mt-24">{renderInline(text)}</h3>; }
      if (line.startsWith('> ')) return <blockquote key={i} className="pl-5 py-2 my-6 text-white/80 italic border-l-2" style={{ borderColor: ACCENT }}>{renderInline(line.slice(2))}</blockquote>;
      if (line.startsWith('- ')) return <li key={i} className="ml-6 mb-2 list-disc text-white/75 leading-relaxed marker:text-[#ff4000]">{renderInline(line.slice(2))}</li>;
      if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-6 mb-2 list-decimal text-white/75 leading-relaxed marker:text-[#ff4000] marker:font-mono">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>;
      if (line.trim() === '' || line.trim() === '---') return <div key={i} className="h-2" />;
      return <p key={i} className="text-white/75 leading-relaxed mb-4 text-base md:text-lg">{renderInline(line)}</p>;
    });
  };

  const toc = extractTOC(post.content);

  return (
    <Layout>
      <SEO title={post.meta_title || post.title} description={post.meta_description || post.excerpt} canonical={currentPath} image={post.image} type="article" jsonLd={articleSchema} lang={i18n.language as 'pt' | 'en' | 'es'} />

      {/* HERO — manifesto style */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.14]"
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

        <div className="relative max-w-4xl mx-auto px-6 md:px-12 pt-24 md:pt-32 pb-16 md:pb-20">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" /> {t('blog.backToBlog')}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            {post.category}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 font-black leading-[0.98] tracking-tight text-[clamp(2rem,5.5vw,4.5rem)]"
          >
            {post.title}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 h-px w-32 origin-left"
            style={{ background: `${ACCENT}b3` }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 flex items-center gap-5 text-xs font-mono uppercase tracking-[0.22em] text-white/50"
          >
            <span>
              {new Date(post.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.read_time}
            </span>
          </motion.div>
        </div>
      </section>

      {/* COVER strip */}
      <section className="bg-[#0a0603]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="overflow-hidden rounded-2xl border border-white/10 aspect-[16/8]"
          >
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-[#0a0603] text-white py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <p className="text-xl md:text-2xl leading-relaxed font-light text-white/85 mb-10 pb-10 border-b border-white/10">
              {post.excerpt}
            </p>

            {toc.length > 1 && (
              <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 md:p-8 mb-12">
                <div className="flex items-center gap-2 mb-5">
                  <List className="h-4 w-4" style={{ color: ACCENT }} />
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">
                    {t('blog.tableOfContents')}
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {toc.map((item, i) => (
                    <li key={i} className={item.level === 3 ? 'ml-5' : ''}>
                      <a
                        href={`#${item.id}`}
                        className="text-white/75 hover:text-[#ff4000] transition-colors leading-relaxed inline-flex items-center gap-2 group"
                      >
                        <span className="font-mono text-[10px] text-white/30 group-hover:text-[#ff4000]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="blog-content">
              {renderContent(post.content)}
            </div>

            <div className="mt-16 pt-10 border-t border-white/10">
              <BlogShareContact postTitle={post.title} postSlug={post.slug} />
            </div>
            <BlogComments postId={post.id} />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Próximo passo
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-4 font-black leading-[0.98] tracking-tight text-[clamp(1.75rem,5vw,3.5rem)]"
          >
            {t('blog.needHelp')}{' '}
            <span style={{ color: ACCENT }}>{post.category}</span>?
          </motion.h2>
          <p className="text-white/60 mt-6 max-w-xl mx-auto">{t('blog.needHelpSubtitle')}</p>
          <div className="mt-10">
            <Link
              to="/booking"
              className="inline-flex items-center gap-3 border-2 px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {t('blog.bookFree')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="bg-[#0a0603] text-white py-20 md:py-28 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Continua a ler
              </p>
              <h2 className="text-3xl md:text-4xl font-black mt-2 tracking-tight">
                {t('blog.relatedArticles')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p, i) => (
                <Link key={p.id} to={`/blog/${p.slug}`}>
                  <motion.article
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group cursor-pointer h-full border border-white/10 rounded-2xl overflow-hidden hover:border-[#ff4000]/50 hover:bg-white/[0.02] transition-all"
                  >
                    <div className="overflow-hidden aspect-[16/10]">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                        {p.category}
                      </span>
                      <h3 className="text-lg font-bold mt-3 leading-tight group-hover:text-[#ff4000] transition-colors">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-5 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                        <span>{new Date(p.created_at).toLocaleDateString(dateLocale)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{p.read_time}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogPostPage;
