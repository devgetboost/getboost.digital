import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Wrench, Rocket, Megaphone, Code2, Bot, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import PageHero from '@/components/PageHero';
import heroAnalytics from '@/assets/hero-analytics.jpg';
import { supabase } from '@/integrations/supabase/client';
import { servicesData } from '@/data/services';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import logoHostify from '@/assets/logos/logo-hostify.svg';
import logoProsafe360 from '@/assets/logos/logo-prosafe360.svg';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoPikto from '@/assets/logos/logo-pikto.svg';

type DbService = {
  key: string;
  slug: string;
  image: string;
  price: string;
  icon: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

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
  const [services, setServices] = useState<DbService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    setActiveSlug(hash);
    // Wait for the section to render before scrolling
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [location.hash]);


  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('key, slug, image, price, icon')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        setServices(servicesData.map(s => ({ key: s.key, slug: s.slug, image: s.image, price: s.price, icon: s.icon || '' })));
      } else {
        setServices(data);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  const staticImageMap = Object.fromEntries(servicesData.map(s => [s.key, s.image]));

  return (
    <Layout>
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
      <PageHero
        badgeAccent={t('servicesPage.badgeAccent')}
        badge={t('servicesPage.badge')}
        title={t('servicesPage.title')}
        highlight={t('servicesPage.titleHighlight')}
        subtitle={t('servicesPage.subtitle')}
        cta={{ i18nKey: 'servicesPage.heroCta', href: '/booking', category: 'services', ctaType: 'hero_cta' }}
        secondaryCta={{ i18nKey: 'servicesPage.heroSecondaryCta', href: '/portfolio', category: 'services', ctaType: 'hero_secondary_cta' }}
        checkmarks={[t('servicesPage.checkSatisfaction'), t('servicesPage.checkROI'), t('servicesPage.checkProjects')]}
        backgroundImage={heroAnalytics}
      />

      {/* Áreas de Atuação — 3 categorias com submenus */}
      <section className="section-padding bg-section-alt">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-3">
              Áreas de Atuação
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Três áreas, um <span className="text-primary">parceiro digital</span>
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Marketing, Engenharia de Software e IA aplicada — combinados para escalar o teu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Megaphone,
                id: 'area-marketing',
                title: 'Marketing & Growth',
                items: [
                  { slug: 'branding-identidade', label: 'Branding & Identidade Visual' },
                  { slug: 'marketing-digital', label: 'Marketing Digital' },
                  { slug: 'gestao-redes-sociais', label: 'Gestão de Redes Sociais' },
                  { slug: 'copywriting-conteudo', label: 'Copywriting & Conteúdo' },
                  { slug: 'seo-blog', label: 'SEO & Blog' },
                  { slug: 'google-meta-ads', label: 'Publicidade (Meta, Google, TikTok)' },
                  { slug: 'funis-vendas', label: 'Funis de Vendas' },
                  { slug: 'landing-pages', label: 'Landing Pages de Alta Conversão' },
                  { slug: 'auditoria-marketing', label: 'Auditoria de Marketing' },
                ],
              },
              {
                icon: Code2,
                id: 'area-software',
                title: 'Software Engineering',
                items: [
                  { slug: 'desenvolvimento-web', label: 'Desenvolvimento Web' },
                  { slug: 'desenvolvimento-mobile', label: 'Desenvolvimento Mobile (iOS/Android)' },
                  { slug: 'desenvolvimento-saas', label: 'Desenvolvimento SaaS' },
                  { slug: 'sistemas-gestao-pmes', label: 'Sistemas de Gestão para PMEs' },
                  { slug: 'integracoes-erp-crm', label: 'Integrações com ERPs/CRMs' },
                  { slug: 'ux-ui-design', label: 'UX/UI Design' },
                  { slug: 'mvp-30-dias', label: 'MVP em 30 dias' },
                ],
              },
              {
                icon: Bot,
                id: 'area-ia',
                title: 'Automação & Inteligência Artificial',
                items: [
                  { slug: 'copilot-empresarial', label: 'Copilot Empresarial' },
                  { slug: 'bots-whatsapp-ia', label: 'Bots de WhatsApp com IA' },
                  { slug: 'treino-modelos-ia', label: 'Treino de Modelos com Dados Reais' },
                ],
              },
            ].map((area, i) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.title}
                  id={area.id}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="scroll-mt-28 bg-white dark:bg-card rounded-2xl border border-border/40 p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{area.title}</h3>
                  <ul className="space-y-2.5">
                    {area.items.map((item) => (
                      <li
                        key={item.slug}
                        id={item.slug}
                        className={`scroll-mt-28 flex items-start gap-2.5 text-sm rounded-md px-2 py-1 -mx-2 transition-colors ${
                          activeSlug === item.slug
                            ? 'bg-primary/10 text-foreground font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
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
                        <div className="bg-white dark:bg-card rounded-2xl overflow-hidden h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/40">
                          <div className="aspect-[16/10] overflow-hidden">
                            <img src={service.image || staticImageMap[service.key] || ''} alt={t(`servicesPage.items.${service.key}.title`)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={800} height={512} />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-2">{t(`servicesPage.items.${service.key}.title`)}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t(`servicesPage.items.${service.key}.desc`)}</p>
                            <div className="border-t border-border pt-4 flex items-end justify-between">
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
                    <div className="group bg-white dark:bg-card rounded-2xl overflow-hidden h-full border border-border/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <Link to={product.key === 'hostify' ? '/solucoes/hostify' : product.key === 'qook' ? '/qook' : '#'} className="block h-full">
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
                          <div className="border-t border-border pt-4">
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
    </Layout>
  );
};

export default Services;
