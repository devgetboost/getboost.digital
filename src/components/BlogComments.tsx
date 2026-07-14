import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, User, Clock, Send, ShieldCheck, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Comment = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
};

interface BlogCommentsProps {
  postId: string;
}

const BlogComments = ({ postId }: BlogCommentsProps) => {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const dateLocale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'en' ? 'en-GB' : 'pt-PT';

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('blog_comments_public')
      .select('id, author_name, content, created_at, parent_id')
      .eq('blog_post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    setComments(data || []);
    setLoading(false);
  };

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;

    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      toast.error(t('blog.errorWait'));
      return;
    }

    if (!name.trim() || !email.trim() || !content.trim()) {
      toast.error(t('blog.errorRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(t('blog.errorEmail'));
      return;
    }

    if (content.trim().length < 5 || content.trim().length > 2000) {
      toast.error(t('blog.errorLength'));
      return;
    }

    if (name.trim().length > 100) {
      toast.error(t('blog.errorNameLong'));
      return;
    }

    setSubmitting(true);

    const commentId = crypto.randomUUID();

    const { error } = await supabase.from('blog_comments').insert({
      id: commentId,
      blog_post_id: postId,
      author_name: name.trim().slice(0, 100),
      author_email: email.trim().slice(0, 255),
      content: content.trim().slice(0, 2000),
      status: 'pending',
      parent_id: replyTo?.id || null,
    });

    if (error) {
      toast.error(t('blog.errorSend'));
    } else {
      analytics.trackForm('blog_comments', 'comment_success', { 
        post_id: postId,
        is_reply: !!replyTo,
        language: i18n.language 
      });
      toast.success(t('blog.successComment'));
      
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'new-comment-notification',
            recipientEmail: 'geral@getboost.digital',
            idempotencyKey: `comment-notify-${commentId}`,
            templateData: {
              authorName: name.trim(),
              authorEmail: email.trim(),
              postTitle: document.title,
              commentPreview: content.trim().slice(0, 200),
              adminUrl: `${window.location.origin}/admin/comentarios`,
            },
          },
        });
      } catch {
        // Notification failure shouldn't affect the user experience
      }

      setName('');
      setEmail('');
      setContent('');
      setReplyTo(null);
      setLastSubmitTime(now);
    }
    setSubmitting(false);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/[0.03] border border-white/10 rounded-xl p-5 ${isReply ? 'ml-8 mt-3 border-l-2 border-l-[#ff4000]/40' : ''}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-[#ff4000]/15 flex items-center justify-center">
            <User className="h-4 w-4" style={{ color: '#ff4000' }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">{comment.author_name}</p>
            <p className="text-xs text-white/50 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(comment.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => {
                setReplyTo(comment);
                document.getElementById('comment-content')?.focus();
              }}
            >
              <Reply className="h-3.5 w-3.5" /> {t('blog.reply')}
            </Button>
          )}
        </div>
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{comment.content}</p>

        {hasReplies && !isReply && (
          <div className="mt-3">
            <button
              onClick={() => toggleReplies(comment.id)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {t('blog.replyCount', { count: replies.length })}
            </button>
            <AnimatePresence>
              {isExpanded && replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <section className="mt-16 pt-10 border-t border-white/10">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
        <MessageCircle className="h-6 w-6" style={{ color: '#ff4000' }} />
        {t('blog.comments')} {topLevelComments.length > 0 && <span className="text-base font-normal text-white/50">({topLevelComments.length})</span>}
      </h2>

      {/* Comment form */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 mb-10 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-1 text-white">
          {replyTo ? t('blog.replyTo', { name: replyTo.author_name }) : t('blog.leaveComment')}
        </h3>
        {replyTo && (
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-white/60 italic truncate max-w-[300px]">"{replyTo.content.slice(0, 80)}..."</p>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setReplyTo(null)}>{t('blog.cancel')}</Button>
          </div>
        )}
        <p className="text-sm text-white/60 mb-6 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> {t('blog.moderationNote')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comment-name" className="text-sm font-medium mb-1.5 block text-white/90">
                {t('blog.commentName')} <span style={{ color: '#ff4000' }}>*</span>
              </label>
              <Input id="comment-name" placeholder={t('blog.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className="bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#ff4000]/40 focus-visible:border-[#ff4000]/60" />
            </div>
            <div>
              <label htmlFor="comment-email" className="text-sm font-medium mb-1.5 block text-white/90">
                {t('blog.commentEmail')} <span style={{ color: '#ff4000' }}>*</span>
                <span className="text-xs text-white/50 ml-1">{t('blog.emailNotPublished')}</span>
              </label>
              <Input id="comment-email" type="email" placeholder={t('blog.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#ff4000]/40 focus-visible:border-[#ff4000]/60" />
            </div>
          </div>
          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>
          <div>
            <label htmlFor="comment-content" className="text-sm font-medium mb-1.5 block text-white/90">
              {t('blog.commentLabel')} <span style={{ color: '#ff4000' }}>*</span>
            </label>
            <Textarea id="comment-content" placeholder={t('blog.commentPlaceholder')} value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} rows={4} required className="bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#ff4000]/40 focus-visible:border-[#ff4000]/60" />
            <p className="text-xs text-white/50 mt-1 text-right">{content.length}/2000</p>
          </div>
          <Button type="submit" disabled={submitting} className="rounded-xl bg-[#ff4000] hover:bg-[#ff4000]/90 text-white">
            <Send className="h-4 w-4 mr-2" />
            {submitting ? t('blog.sending') : replyTo ? t('blog.sendReply') : t('blog.sendComment')}
          </Button>
        </form>
      </div>

      {/* Comments list */}
      {loading ? (
        <p className="text-white/60 text-sm">{t('blog.loadingComments')}</p>
      ) : topLevelComments.length === 0 ? (
        <p className="text-white/60 text-sm text-center py-8">{t('blog.noComments')}</p>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {topLevelComments.map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};

export default BlogComments;
