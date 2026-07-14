import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram, Linkedin, Twitter, ArrowRight, Loader2, Check, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import logoNunoCruz from '@/assets/logo-getboost-soft-branca.svg';

const languages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const Footer = () => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error(t('footer.fillNameEmail'));
      return;
    }
    if (!consent) {
      toast.error(t('footer.consentRequired'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      consent: true,
      consented_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) {
      if (error.code === '23505') {
        toast.info(t('footer.alreadySubscribed'));
      } else {
        toast.error(t('footer.errorSubscribe'));
      }
      return;
    }
    setSuccess(true);
    analytics.trackForm('newsletter', 'subscribe_success', { language: i18n.language });
    setName('');
    setEmail('');
    setConsent(false);
    toast.success(t('footer.successSubscribe'));
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <footer className="relative overflow-hidden bg-[hsl(0,0%,5%)] text-white [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/60" role="contentinfo">
      {/* Ambient grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 80% 20%, black 10%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 80% 20%, black 10%, transparent 65%)',
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(255,64,0,0.45) 0%, rgba(0,0,0,0) 65%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to={i18n.language === 'pt' ? '/' : `/${i18n.language}`} className="flex items-center gap-2">
              <img src={logoNunoCruz} alt="Getboost Digital" className="h-14 w-auto" />
            </Link>
            <p className="mt-4 text-muted-foreground text-sm max-w-sm leading-relaxed whitespace-pre-line">
              {t('footer.brandDescFull')}{'\n\n'}
              {t('footer.brandDescBody')}{'\n\n'}
              {t('footer.brandDescClose')}
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" onClick={() => analytics.trackClick('social', 'instagram', 'awareness')} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" onClick={() => analytics.trackClick('social', 'linkedin', 'awareness')} className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" onClick={() => analytics.trackClick('social', 'twitter', 'awareness')} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">{t('footer.links')}</h4>
            <nav className="flex flex-col gap-3" aria-label="Footer navigation">
              <Link to={i18n.language === 'pt' ? '/portfolio' : `/${i18n.language}/portfolio`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('nav.portfolio')}</Link>
              <Link to={i18n.language === 'pt' ? '/blog' : `/${i18n.language}/blog`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('nav.blog')}</Link>
              <Link to={i18n.language === 'pt' ? '/sobre-nos' : `/${i18n.language}/sobre-nos`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Sobre Nós</Link>
              <Link to={i18n.language === 'pt' ? '/equipa' : `/${i18n.language}/equipa`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Equipa</Link>
              <Link to={i18n.language === 'pt' ? '/carreira' : `/${i18n.language}/carreira`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Carreira</Link>
            </nav>
          </div>

          {/* Serviços */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">{t('footer.servicesTitle')}</h4>
            <nav className="flex flex-col gap-3" aria-label="Footer services">
              <Link to={i18n.language === 'pt' ? '/services/gestao-redes-sociais' : `/${i18n.language}/services/gestao-redes-sociais`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.socialMedia.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/desenvolvimento-web' : `/${i18n.language}/services/desenvolvimento-web`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.webDev.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/desenvolvimento-software' : `/${i18n.language}/services/desenvolvimento-software`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.softwareDev.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/google-business-profile' : `/${i18n.language}/services/google-business-profile`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.googleBusiness.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/google-meta-ads' : `/${i18n.language}/services/google-meta-ads`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.ads.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/consultoria-estrategica' : `/${i18n.language}/services/consultoria-estrategica`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.consultoria.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/fotografia-drone' : `/${i18n.language}/services/fotografia-drone`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.drone.title')}</Link>
              <Link to={i18n.language === 'pt' ? '/services/solucao-personalizada' : `/${i18n.language}/services/solucao-personalizada`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('servicesPage.items.custom.title')}</Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-foreground">{t('footer.newsletter')}</h4>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {t('footer.newsletterDesc')}
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder={t('footer.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-full bg-white/5 border border-white/15 text-white placeholder:text-white/40 text-sm px-5 backdrop-blur-sm transition-all focus:bg-white/10 focus:border-[#ff4000]/60 focus-visible:ring-2 focus-visible:ring-[#ff4000]/30 focus-visible:ring-offset-0"
                maxLength={100}
                disabled={loading}
              />
              <div className="relative">
                <Input
                  type="email"
                  placeholder={t('footer.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-full bg-white/5 border border-white/15 text-white placeholder:text-white/40 text-sm pl-5 pr-14 backdrop-blur-sm transition-all focus:bg-white/10 focus:border-[#ff4000]/60 focus-visible:ring-2 focus-visible:ring-[#ff4000]/30 focus-visible:ring-offset-0"
                  maxLength={255}
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  aria-label={t('footer.subscribe')}
                  disabled={loading || success}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#ff4000] text-white flex items-center justify-center shadow-[0_6px_20px_-6px_rgba(255,64,0,0.7)] transition-all hover:scale-105 hover:bg-[#ff5a1f] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  disabled={loading}
                  className="mt-0.5 shrink-0 rounded-[4px] border-white/30 data-[state=checked]:bg-[#ff4000] data-[state=checked]:border-[#ff4000] data-[state=checked]:text-white"
                />
                <span className="text-[10px] leading-snug text-white/50 group-hover:text-white/80 transition-colors">
                  {t('footer.consent')}
                </span>
              </label>
            </form>
          </div>
        </div>

        {/* Contact & Address Block */}
        <div className="border-t border-white/10 mt-12 pt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="font-semibold text-sm tracking-widest text-foreground uppercase mb-4">{t('footer.contactTitle')}</h4>
            <p className="text-sm text-foreground font-semibold mb-0.5">
              <Phone className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              T : <a href="tel:+351963574400" className="hover:text-primary transition-colors">+(351) 963 574 400</a>
            </p>
            <p className="text-xs text-muted-foreground mb-3 ml-5">{t('footer.mobileNote')}</p>
            <p className="text-sm text-foreground font-semibold">
              <Mail className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              E : <a href="mailto:contacto@getboost.digital" className="hover:text-primary transition-colors">contacto@getboost.digital</a>
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-widest text-foreground uppercase mb-4">{t('footer.addressTitle')}</h4>
            <p className="text-sm text-foreground leading-relaxed">
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Rua Passeio Infante Dom Henrique, 22 Sala 33, 1º Piso<br />
              <span className="ml-5">3080-042 Figueira da Foz</span>
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Getboost Digital. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to={i18n.language === 'pt' ? '/politica-de-privacidade' : `/${i18n.language}/politica-de-privacidade`} className="w-fit relative text-xs text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('footer.privacyPolicy')}</Link>
            <Link to={i18n.language === 'pt' ? '/politica-de-cookies' : `/${i18n.language}/politica-de-cookies`} className="w-fit relative text-xs text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('footer.cookiePolicy')}</Link>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('show-cookie-settings'))}
              className="w-fit relative text-xs text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all"
            >
              {t('cookies.manageCookies')}
            </button>
            <a href="https://www.consumidor.gov.pt/resolucao-de-litigios/resolucao-alternativa-de-litigios.aspx" target="_blank" rel="noopener noreferrer" className="w-fit relative text-xs text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('footer.disputes')}</a>
            <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="w-fit relative text-xs text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('footer.complaints')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;