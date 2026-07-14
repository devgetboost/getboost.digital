import { useTranslation } from 'react-i18next';
import { analytics } from '@/lib/analytics';
import { Facebook, Mail, Linkedin, MessageCircle, Instagram } from 'lucide-react';
import authorPhoto from '@/assets/nuno-cruz.webp';

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.18V22l3.04-1.67c.81.23 1.67.35 2.81.35 5.64 0 10-4.13 10-9.68S17.64 2 12 2zm1.09 13.02l-2.54-2.73L5.4 15.02l5.63-5.98 2.6 2.73 5.09-2.73-5.63 5.98z" />
  </svg>
);

interface BlogShareContactProps {
  postTitle: string;
  postSlug: string;
}

const BlogShareContact = ({ postTitle, postSlug }: BlogShareContactProps) => {
  const { t } = useTranslation();
  const postUrl = `https://getboost.digital/blog/${postSlug}`;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(postTitle);

  const shareLinks = [
    { label: 'Facebook', icon: <Facebook className="w-5 h-5" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'X', icon: <XIcon className="w-5 h-5" />, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: 'Email', icon: <Mail className="w-5 h-5" />, href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
    { label: 'Messenger', icon: <MessengerIcon className="w-5 h-5" />, href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=100&redirect_uri=${encodedUrl}` },
    { label: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}` },
  ];

  const socialLinks = [
    { label: 'Facebook', icon: <Facebook className="w-4 h-4" />, href: 'https://www.facebook.com/nunocruz.marketing' },
    { label: 'Instagram', icon: <Instagram className="w-4 h-4" />, href: 'https://www.instagram.com/nunocruz.marketing' },
    { label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, href: 'https://www.linkedin.com/in/nunocruzmarketing' },
  ];

  return (
    <div className="border-t border-border pt-10 mt-10 space-y-10">
      {/* Share Section */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-primary mb-5">{t('blog.share')}</h3>
        <div className="flex items-center justify-center gap-4 mb-6">
          {shareLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => analytics.trackClick('blog', `share_${item.label.toLowerCase()}`, 'awareness', { post_slug: postSlug })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('blog.share')} ${item.label}`}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              {item.icon}
            </a>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-base">
          <a href="mailto:contacto@getboost.digital" className="text-primary hover:underline font-medium">
            contacto@getboost.digital
          </a>
          <a href="mailto:contacto@getboost.digital" className="font-semibold text-foreground hover:text-primary transition-colors">
            {t('blog.contactUs')}
          </a>
        </div>
      </div>

      {/* About the Author Section */}
      <div className="border-t border-border pt-8">
        <h3 className="text-xl font-bold text-foreground mb-5">{t('blog.aboutAuthor')}</h3>
        <div className="flex items-start gap-5">
          <img
            src={authorPhoto}
            alt="Getboost Digital"
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-foreground">Getboost Digital</span>
              <a href="mailto:contacto@getboost.digital" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                contacto@getboost.digital
              </a>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              {t('blog.authorBio')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogShareContact;
