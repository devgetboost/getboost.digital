import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Instagram, Linkedin, Twitter, ArrowRight, Loader2, Check, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { legacySupabase } from '@/integrations/supabase/client';
import {
  subscribeNewsletter,
  CommercialWriteError,
} from '@/lib/commercialApi';
import { marketForLanguage, localeForLanguage } from '@/lib/commercialMarket';
import { MARKET_OPTIONS } from '@/components/LanguageSwitcher';
import { switchMarketPath } from '@/lib/markets';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';
import { rememberMarket } from '@/components/LanguageManager';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import logoNunoCruz from '@/assets/logo-getboost-soft.svg';
import { CONTACT } from '@/data/brandRegistry';
import { PRODUCTS } from '@/data/products';

const languages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const Footer = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace(/^\/+/, '').split('/')[0];
  const currentMarket: MarketCode = currentPath === 'br' ? 'BR' : currentPath === 'en' ? 'INTL' : DEFAULT_MARKET;

  // Mirrors the header switcher: move the URL, then the interface language.
  const change = (market: MarketCode) => {
    if (market !== currentMarket) {
      rememberMarket(market);
      navigate(switchMarketPath(location.pathname, location.search, location.hash, market));
    }
    const targetUiLanguage = market === 'INTL' && i18n.language === 'es' ? 'es' : market === 'INTL' ? 'en' : 'pt';
    if (i18n.language !== targetUiLanguage) i18n.changeLanguage(targetUiLanguage);
    try { localStorage.setItem('lang', targetUiLanguage); } catch {}
  };
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
    // R1C5: the browser no longer writes `newsletter_subscribers` directly.
    // Clean V1 records consent through `consent_at` and has no display-name
    // column, so `name` stops here and is not persisted.
    const { error } = await subscribeNewsletter({
      email: email.trim(),
      source: 'footer',
      market: marketForLanguage(i18n.language),
      locale: localeForLanguage(i18n.language),
    }).then(() => ({ error: null })).catch((err: CommercialWriteError) => ({ error: err }));
    setLoading(false);
    if (error) {
      if (error.status === 409) {
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
    <footer className="relative overflow-hidden border-t border-ink-primary/10 bg-canvas-section text-ink-primary" role="contentinfo">
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
            'radial-gradient(circle, rgba(255,64,0,0.22) 0%, rgba(0,0,0,0) 65%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16">

        {/* R22 — editorial footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <p className="ed-kicker text-ink-secondary">
            <span className="ed-kicker-num">(05)</span>
            <span>{t('footer.contactTitle')}</span>
          </p>
          <h2 className="ed-display mt-6 max-w-5xl text-ink-primary text-[clamp(2.5rem,6vw,5.5rem)]">
            {t('footer.bigCtaTitle', 'Pronto para acelerar o teu')} <em>{t('footer.bigCtaAccent', 'negócio?')}</em>
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full">
              <Link
                to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`}
                onClick={() => analytics.trackClick('footer', 'footer_cta_booking', 'conversion')}
              >
                {t('footer.bigCtaBook', 'Agendar diagnóstico')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link
                to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`}
                onClick={() => analytics.trackClick('footer', 'footer_cta_contact', 'consideration')}
              >
                {t('footer.bigCtaContact', 'Falar connosco')}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* R18.7 — footer blocks share the global reveal (fade-up, once). */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12"
        >
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to={i18n.language === 'pt' ? '/' : `/${i18n.language}`} className="flex items-center gap-2">
              <img src={logoNunoCruz} alt="Getboost Digital" width={2107} height={852} className="h-14 w-auto" />
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

          {/* Wave 3B — footer IA mirrors the primary navigation. COMPANY is
              footer-only (removed from the primary nav in Wave 3B). */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">Empresa</h3>
            <nav className="flex flex-col gap-3" aria-label="Footer company">
              <Link to={i18n.language === 'pt' ? '/sobre-nos' : `/${i18n.language}/sobre-nos`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Sobre Nós</Link>
              <Link to={i18n.language === 'pt' ? '/equipa' : `/${i18n.language}/equipa`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Equipa</Link>
              <Link to={i18n.language === 'pt' ? '/carreira' : `/${i18n.language}/carreira`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Carreira</Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">Trabalho</h3>
            <nav className="flex flex-col gap-3" aria-label="Footer work">
              <Link to={i18n.language === 'pt' ? '/portfolio' : `/${i18n.language}/portfolio`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('nav.portfolio')}</Link>
              <Link to={i18n.language === 'pt' ? '/casos-de-sucesso' : `/${i18n.language}/casos-de-sucesso`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Casos de Sucesso</Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">Insights</h3>
            <nav className="flex flex-col gap-3" aria-label="Footer insights">
              <Link to={i18n.language === 'pt' ? '/blog' : `/${i18n.language}/blog`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">{t('nav.blog')}</Link>
              <Link to={i18n.language === 'pt' ? '/resources' : `/${i18n.language}/resources`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Recursos</Link>
              <Link to={i18n.language === 'pt' ? '/podcast' : `/${i18n.language}/podcast`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Podcast</Link>
              <Link to={i18n.language === 'pt' ? '/academy' : `/${i18n.language}/academy`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Academy</Link>
              <Link to={i18n.language === 'pt' ? '/webinars' : `/${i18n.language}/webinars`} className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Webinars</Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-sm mb-2 text-foreground">{t('footer.newsletter')}</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {t('footer.newsletterDesc')}
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder={t('footer.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-full border border-ink-primary/15 bg-white text-ink-primary placeholder:text-ink-tertiary text-sm px-5 transition-all focus:border-[#ff4000]/60 focus-visible:ring-2 focus-visible:ring-[#ff4000]/30 focus-visible:ring-offset-0"
                maxLength={100}
                disabled={loading}
              />
              <div className="relative">
                <Input
                  type="email"
                  placeholder={t('footer.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-full border border-ink-primary/15 bg-white text-ink-primary placeholder:text-ink-tertiary text-sm pl-5 pr-14 transition-all focus:border-[#ff4000]/60 focus-visible:ring-2 focus-visible:ring-[#ff4000]/30 focus-visible:ring-offset-0"
                  maxLength={255}
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  aria-label={t('footer.subscribe')}
                  disabled={loading || success}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#ff4000] text-white flex items-center justify-center shadow-[0_6px_20px_-6px_rgba(255,64,0,0.7)] transition-all hover:scale-105 hover:bg-brand-600 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  disabled={loading}
                  className="mt-0.5 shrink-0 rounded-[4px] border-ink-primary/30 data-[state=checked]:bg-[#ff4000] data-[state=checked]:border-[#ff4000] data-[state=checked]:text-white"
                />
                <span className="text-[10px] leading-snug text-ink-tertiary group-hover:text-ink-secondary transition-colors">
                  {t('footer.consent')}
                </span>
              </label>
            </form>
          </div>
        </motion.div>

        {/* Products strip — the footer is the complete IA map */}
        <div className="border-t border-ink-primary/10 mt-12 pt-8">
          <h3 className="font-semibold text-sm mb-4 text-foreground">Produtos</h3>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer products">
            {PRODUCTS.map((product) =>
              product.to ? (
                <Link
                  key={product.slug}
                  to={i18n.language === 'pt' ? product.to : `/${i18n.language}${product.to}`}
                  onClick={() => analytics.trackProduct(product.slug, 'click', 'footer_products')}
                  className="w-fit relative text-sm text-muted-foreground hover:text-primary transition-colors after:absolute after:left-0 after:bottom-[-2px] after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all"
                >
                  {product.name}
                </Link>
              ) : (
                /* Institutional entry: representation only, never a link. */
                <span key={product.slug} className="w-fit relative text-sm text-muted-foreground">
                  {product.name}
                </span>
              ),
            )}
          </nav>
        </div>

        {/* Contact & Address Block */}
        <div className="border-t border-ink-primary/10 mt-12 pt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="font-semibold text-sm tracking-widest text-foreground uppercase mb-4">{t('footer.contactTitle')}</h3>
            <p className="text-sm text-foreground font-semibold mb-0.5">
              <Phone className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              T : <a href={`tel:${CONTACT.phone.e164}`} onClick={() => analytics.trackOutbound('phone', 'footer')} className="hover:text-primary transition-colors">{CONTACT.phone.display}</a>
            </p>
            <p className="text-xs text-muted-foreground mb-3 ml-5">{t('footer.mobileNote')}</p>
            <p className="text-sm text-foreground font-semibold">
              <Mail className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              E : <a href={`mailto:${CONTACT.email}`} onClick={() => analytics.trackOutbound('email', 'footer')} className="hover:text-primary transition-colors">{CONTACT.email}</a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-widest text-foreground uppercase mb-4">{t('footer.addressTitle')}</h3>
            <p className="text-sm text-foreground leading-relaxed">
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              {CONTACT.address.street}<br />
              <span className="ml-5">{CONTACT.address.postalCode} {CONTACT.address.locality}</span>
            </p>
          </div>
        </div>

        <div className="border-t border-ink-primary/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Getboost Digital. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              {/* R1C7: the footer switcher now moves the market like the header
                  one. It previously only called `changeLanguage`, so the URL
                  (and therefore the `/:lang` route) disagreed with the UI and
                  `LanguageManager` reverted it on the next navigation. */}
              {MARKET_OPTIONS.map((option) => (
                <button
                  key={option.market}
                  onClick={() => change(option.market)}
                  className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                    currentMarket === option.market
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={option.label}
                >
                  {option.market}
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