import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Shield, Cookie, X, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from './ui/switch';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();
  
  const CONSENT_VERSION = '1.0';
  const CONSENT_KEY = 'cookieConsent';

  // GDPR: optional categories must be OFF by default (opt-in required)
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
      // Ensure gtag has "denied" defaults until the user chooses
      setTimeout(() => {
        updateGoogleConsent({ analytics: false, marketing: false }, true);
      }, 1000);
    } else {
      try {
        const consentData = JSON.parse(consent);
        // Re-prompt if consent was recorded under an older policy version
        if (consentData.version !== CONSENT_VERSION) {
          setIsVisible(true);
          updateGoogleConsent({ analytics: false, marketing: false }, true);
        } else {
          setPreferences({
            essential: true,
            analytics: !!consentData.analytics,
            marketing: !!consentData.marketing
          });
          updateGoogleConsent(consentData);
        }
      } catch {
        setIsVisible(true);
      }
    }

    const handleOpenSettings = () => {
      setIsVisible(true);
      setShowDetails(true);
    };

    window.addEventListener('show-cookie-settings', handleOpenSettings);
    return () => window.removeEventListener('show-cookie-settings', handleOpenSettings);
  }, []);

  const updateGoogleConsent = (consent: { analytics: boolean; marketing: boolean }, isDefault = false) => {
    if (typeof window.gtag === 'function') {
      const mode = isDefault ? 'default' : 'update';
      window.gtag('consent', mode, {
        'analytics_storage': consent.analytics ? 'granted' : 'denied',
        'ad_storage': consent.marketing ? 'granted' : 'denied',
        'ad_user_data': consent.marketing ? 'granted' : 'denied',
        'ad_personalization': consent.marketing ? 'granted' : 'denied',
      });

      window.dataLayer?.push({
        event: 'consent_updated',
        consent_analytics: consent.analytics,
        consent_marketing: consent.marketing
      });
    }
  };

  const persistConsent = (analytics: boolean, marketing: boolean) => {
    const record = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics,
      marketing,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    updateGoogleConsent({ analytics, marketing });
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleSavePreferences = () => {
    persistConsent(preferences.analytics, preferences.marketing);
  };

  const handleAcceptAll = () => {
    setPreferences({ essential: true, analytics: true, marketing: true });
    persistConsent(true, true);
  };

  const handleDeclineAll = () => {
    setPreferences({ essential: true, analytics: false, marketing: false });
    persistConsent(false, false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-background border border-border rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="space-y-6 relative z-10">
                {!showDetails ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex-shrink-0 bg-primary/10 p-4 rounded-xl">
                      <Cookie className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="flex-grow space-y-2">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        {t('cookies.title')}
                        <Shield className="w-4 h-4 text-primary/60" />
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {t('cookies.description')}{' '}
                        <a 
                          href="/politica-de-cookies" 
                          className="text-primary hover:underline font-medium transition-colors"
                        >
                          {t('cookies.policyLink')}
                        </a>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDetails(true)}
                        className="border-border hover:bg-muted"
                      >
                        {t('cookies.customize')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeclineAll}
                        className="border-primary/30 text-foreground hover:bg-primary/5"
                      >
                        {t('cookies.decline')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAcceptAll}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20"
                      >
                        {t('cookies.accept')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        {t('cookies.customize')}
                        <Info className="w-4 h-4 text-primary/60" />
                      </h3>
                      <Button variant="ghost" size="icon" aria-label="Fechar personalização de cookies" onClick={() => setShowDetails(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Essential */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{t('cookies.essential')}</p>
                        </div>
                        <Switch checked={true} disabled />
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{t('cookies.analytics')}</p>
                        </div>
                        <Switch 
                          checked={preferences.analytics} 
                          onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))} 
                        />
                      </div>

                      {/* Marketing */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{t('cookies.marketing')}</p>
                        </div>
                        <Switch 
                          checked={preferences.marketing} 
                          onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))} 
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setShowDetails(false)}>
                        {t('common.back', 'Voltar')}
                      </Button>
                      <Button onClick={handleSavePreferences}>
                        {t('cookies.save')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
