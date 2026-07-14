import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

// Validation of CTA keys across languages
const REQUIRED_CTA_KEYS = [
  'about.ctaCta',
  'about.ctaSecondaryCta',
  'about.heroCta',
  'about.heroSecondaryCta',
  'contact.chatNow',
  'contact.heroCta',
  'contact.submitting',
  'contact.submitButton',
  'finalCta.cta',
  'finalCta.ctaSecondary',
  'finalCta.hostifyFinal',
  'finalCta.hostifyHero',
  'finalCta.qookFinal',
  'finalCta.qookHero',
  'hero.ctaSecondary',
  'homepage.discoverCta',
  'homepage.existingCta',
  'homepage.heroCta',
  'homepage.newCta',
  'nav.contact',
  'portfolio.viewAll',
  'portfolio.viewAllShort',
  'portfolioPage.heroCta',
  'portfolioPage.heroSecondaryCta',
  'services.viewDetails',
  'servicesPage.heroCta',
  'servicesPage.heroSecondaryCta',
  'servicesPage.serviceDetail.bookConsultation',
  'servicesPage.serviceDetail.ctaBook',
  'servicesPage.serviceDetail.ctaChat',
  'specialist.cta'
];

const validateKeys = () => {
  const languages = { pt, en, es };
  const missing: string[] = [];

  REQUIRED_CTA_KEYS.forEach(key => {
    const parts = key.split('.');
    Object.entries(languages).forEach(([lang, data]) => {
      let current: any = data;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          missing.push(`${lang}:${key}`);
          break;
        }
      }
    });
  });

  if (missing.length > 0) {
    console.error('[i18n Validation Error] Missing critical CTA keys:', missing);
    if (process.env.NODE_ENV === 'production') {
      // In production we just log, but in development we could throw to fail the build/runtime
    }
  }
};

validateKeys();

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en }, es: { translation: es } },
  lng: 'pt',
  fallbackLng: 'pt', // Automatic fallback to primary language
  interpolation: { escapeValue: false },
});

export default i18n;
