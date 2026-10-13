import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Wrench, Rocket, Megaphone, Code2, Bot, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { StandardCTA } from '@/components/StandardCTA';
import { useProducts } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import { PRODUCTS } from '@/data/products';
import { SOLUCOES_SUBMENU } from '@/data/solucoesSubmenu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import logoHostify from '@/assets/logos/logo-hostify.svg';
import logoProsafe360 from '@/assets/logos/logo-prosafe360.svg';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoPikto from '@/assets/logos/logo-pikto.svg';
import { Reveal } from '@/components/ui/reveal';

const saasProducts = [
  {
    key: 'hostify',
    name: 'Hostify',
    desc: 'Otimize a gestão da sua pousada ou alojamento local. Hostify: automação de reservas, check-in digital e gestão simplificada para o mercado brasileiro.',
    image: logoHostify,
    status: 'Em breve',
  },
  {
    key: 'prosafe360',
    name: 'ProSafe360',
    desc: 'Software de gestão de segurança e saúde no trabalho com relatórios automáticos e conformidade legal.',
    image: logoProsafe360,
    status: 'Em breve',
  },
  {
    key: 'qook',
    name: 'Qook',
    desc: 'Sistema de gestão para restaurantes com menu digital, pedidos online e controlo de stock inteligente.',
    image: logoQook,
    status: 'Em breve',
  },
  {
    key: 'motivae',
    name: 'Motivae',
    desc: 'Plataforma de bem-estar e produtividade para equipas com desafios, métricas e gamificação.',
    image: logoMotivae,
    status: 'Em breve',
  },
  {
    key: 'pikto',
    name: 'Pikto',
    desc: 'Ferramenta de criação de conteúdo visual com templates profissionais e IA integrada.',
    image: logoPikto,
    status: 'Em breve',
  },
];

const Services = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    setActiveSlug(hash);
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [location.hash]);

  const { data: products, loading } = useProducts();
  const productImageMap = Object.fromEntries(
    (products ?? []).map(product => [product.slug, mediaUrl(product.logoPath) ?? mediaUrl(product.heroMediaPath) ?? '']),
  );

  const services = (products ?? []).map(product => ({
    key: product.slug,
    slug: product.slug,
    image: mediaUrl(product.logoPath) ?? mediaUrl(product.heroMediaPath) ?? '',
    price: '',
    icon: '',
  }));

  return (
    <Layout>
    <ScrollDepth location="services" />
      <SEO
        title={`${t('servicesPage.title')} ${t('servicesPage.titleHighlight')}`}
        description={t('servicesPage.subtitle')}
        canonical="/solucoes"
        lang={i18n.language as 'pt' | 'en' | 'es'}
        jsonLd={[
          {
            '@type': 'CollectionPage',
            name: `${t('servicesPage.title')} ${t('servicesPage.titleHighlight')}`,
            description: t('servicesPage.subtitle'),
            url: 'https://getboost.digital/solucoes',
          },
          {
            '@type': 'Service',
            provider: { '@type': 'Organization', name: 'Getboost Digital', url: 'https://getboost.digital/' },
            areaServed: ['PT', 'BR'],
            name: 'Marketing Digital, Software e IA para PMEs',
            description: t('servicesPage.subtitle'),
          },
        ]}
      />

      {/* ==================================================== 01 HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Soluções · Marketing · Software · IA</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                Três áreas, um <span className="text-brand-600">parceiro digital</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Marketing, Engenharia de Software e IA aplicada — combinados para escalar o teu negócio.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <StandardCTA i18nKey="servicesPage.heroCta" href="/booking" category="services" ctaType="hero_cta" showArrow />
                <StandardCTA i18nKey="servicesPage.heroSecondaryCta" href="/portfolio" category="services" ctaType="hero_secondary_cta" variant="outline" showArrow />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['Marketing', 'Software', 'IA', 'Automação'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: three pillars as a unified flow */}
            <motion.div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="gb-card !p-6 !shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="gb-eyebrow text-ink-tertiary">Como nasce cada projeto</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                      </span>
                      Em produção
                    </span>
                  </div>
                  <MiniFlow
                    steps={['IA', 'Automação', 'Software', 'Growth', 'Operação']}
                    tint="var(--gb-brand-50)"
                    strong="var(--gb-brand-600)"
                  />
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
                    {[
                      { k: `${PRODUCTS.filter(p => p.kind === 'saas').length}`, v: 'produtos próprios' },
                      { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços' },
                      { k: '3', v: 'pilares' },
                    ].map((stat) => (
                      <div key={stat.v}>
                        <div className="gb-text-h3 text-brand-600">{stat.k}</div>
                        <div className="text-[11px] font-medium text-ink-tertiary">{stat.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== 02 ÁREAS DE ATUAÇÃO */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Áreas de Atuação"
            title={'Três áreas, um parceiro digital'}
            description="Marketing, Engenharia de Software e IA aplicada — combinados para escalar o teu negócio."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SOLUCOES_SUBMENU.map((group, i) => (
              <Reveal key={group.title} i={i}>
                <div className="gb-surface-card gb-card-lift h-full">
                  <span
                    className="gb-icon-chip"
                    style={{ '--gb-chip-bg': `var(--gb-${group.id === 'area-marketing' ? 'growth' : group.id === 'area-software' ? 'software' : 'automation'}-tint)`, '--gb-chip-fg': `var(--gb-${group.id === 'area-marketing' ? 'growth' : group.id === 'area-software' ? 'software' : 'automation'}-strong)` }}
                  >
                    <group.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{group.title}</h3>
                  <ul className="mt-4 flex flex-col gap-2">
                    {group.items.map((item) => (
                      <Link key={item.slug} to={item.to} className="group block rounded-xl border border-black/[0.06] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:py-8">
                        <span className="flex items-center gap-2 text-sm font-medium text-ink-primary">
                          <Check className="h-4 w-4 text-brand-600" />
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 03 PRODUTOS EM DESTAQUE */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Produtos Próprios"
            title="Construímos produtos, não apenas websites"
            description="Seis plataformas desenhadas, desenvolvidas e operadas pela Getboost — a prova de que executamos produto, não só serviços."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.filter((p) => p.kind === 'saas' && p.to && p.tagline).map((product, i) => (
              <Reveal key={product.slug} i={i % 3}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'services_products')}>
                  <div className="gb-surface-card gb-card-lift h-full">
                    <div className="flex items-start justify-between gap-3">
                      <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                      {product.status && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                          {product.status}
                        </span>
                      )}
                    </div>
                    {product.category && (
                      <p className="gb-eyebrow mt-4 text-ink-tertiary">{product.category}</p>
                    )}
                    <h3 className="gb-text-h3 mt-2 text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 04 SAAS PRODUCTS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <Tabs defaultValue="custom" className="w-full">
            <TabsList className="w-full max-w-2xl mx-auto mb-12 h-auto bg-transparent p-0 gap-4 flex justify-center">
              <TabsTrigger
                value="custom"
                className="px-8 py-4 rounded-2xl text-base font-semibold bg-card border border-border/60 shadow-sm hover:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:border-primary data-[state=inactive]:text-muted-foreground transition-all duration-300 gap-2.5"
              >
                <Wrench className="h-5 w-5" />
                {t('servicesPage.tabCustom')}
              </TabsTrigger>
              <TabsTrigger
                value="saas"
                className="px-8 py-4 rounded-2xl text-base font-semibold bg-card border border-border/60 shadow-sm hover:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:border-primary data-[state=inactive]:text-muted-foreground transition-all duration-300 gap-2.5"
              >
                <Rocket className="h-5 w-5" />
                {t('servicesPage.tabSaas')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-10 max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-foreground mb-3">{t('servicesPage.customTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('servicesPage.customDesc')}
                </p>
              </motion.div>

              {loading ? (
                <div className="text-center py-20 text-muted-foreground">{t('services.loading')}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map((service, i) => (
                    <motion.div key={service.key} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Link to={`/solucoes/${service.slug}`} className="group block h-full" onClick={() => analytics.trackClick('services', `service_card_${service.slug}`, 'consideration')}>
                        <div className="bg-white dark:bg-card rounded-2xl overflow-hidden h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-black/[0.06]">
                          <div className="aspect-[16/10] overflow-hidden">
                            <img src={service.image || productImageMap[service.key] || ''} alt={t(`servicesPage.items.${service.key}.title`)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={800} height={512} />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-2">{t(`servicesPage.items.${service.key}.title`)}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t(`servicesPage.items.${service.key}.desc`)}</p>
                            <div className="border-t border-black/[0.06] pt-4 flex items-end justify-between">
                              <div>
                                <span className="text-xs text-muted-foreground">{t('services.from')}</span>
                                <p className="text-2xl font-bold text-foreground">{service.price}</p>
                              </div>
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                                {t('services.viewDetails')} <ArrowRight className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saas">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-10 max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-foreground mb-3">{t('servicesPage.saasTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('servicesPage.saasDesc')}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {saasProducts.map((product, i) => (
                  <motion.div key={product.key} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <div className="group bg-white dark:bg-card rounded-2xl overflow-hidden h-full border border-black/[0.06] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <Link to={PRODUCTS.find((p) => p.slug === product.key)?.to ?? '/produtos'} className="block h-full" onClick={() => analytics.trackProduct(product.key, 'click', 'services_products')}>
                        <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center p-10">
                          <img src={product.image} alt={product.name} className="h-16 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" loading="lazy" />
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                            {product.key !== 'hostify' && product.key !== 'qook' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                {t('servicesPage.saasComingSoon')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t(`servicesPage.saasProducts.${product.key}.desc`)}</p>
                          <div className="border-t border-black/[0.06] pt-4">
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                              {t('servicesPage.saasLearnMore')} <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ==================================================== MID CTA */}
      <section className="gb-surface-page gb-section !py-14">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-black/[0.06] bg-white px-8 py-8 shadow-premium md:flex-row md:px-10">
              <div>
                <h2 className="gb-text-h2 text-ink-primary">Tens um projeto em mente?</h2>
                <p className="gb-text-body mt-2 text-ink-secondary">Um diagnóstico gratuito mostra o caminho — sem compromisso.</p>
              </div>
              <StandardCTA asChild size="lg">
                <Link to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`} onClick={() => analytics.trackClick('services', 'services_mid_booking', 'consideration')}>
                  Agendar Diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </StandardCTA>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== FINAL CTA */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Pronto para construir a <span style={{ color: '#ff4000' }}>próxima operação digital</span> do teu negócio?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos o contexto e os objectivos — voltamos com um plano concreto em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <StandardCTA asChild size="lg">
                    <Link to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`} onClick={() => analytics.trackClick('services', 'services_final_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </StandardCTA>
                  <StandardCTA asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`} onClick={() => analytics.trackClick('services', 'services_final_contact', 'consideration')}>
                      Falar com Especialista
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </StandardCTA>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
};

export default Services;