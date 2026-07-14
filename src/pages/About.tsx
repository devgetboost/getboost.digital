import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Palette, Globe, MessageSquare, TrendingUp, BarChart3, Lightbulb, Award, Users, Rocket, ArrowRight, Quote } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO, { personSchema, organizationSchema } from '@/components/SEO';
import PageHero from '@/components/PageHero';
import { AnimatedMarqueeHero } from '@/components/ui/hero-3';
import { StandardCTA } from '@/components/StandardCTA';
import ClientFeedback from '@/components/ui/testimonial';
import nunoPhoto from '@/assets/nuno-cruz.webp';
import heroWorkspace from '@/assets/hero-workspace.jpg';

const HERO_MARQUEE_IMAGES = [
  'https://images.unsplash.com/photo-1756312148347-611b60723c7a?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1757865579201-693dd2080c73?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1756786605218-28f7dd95a493?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1757519740947-eef07a74c4ab?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1757263005786-43d955f07fb1?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1757207445614-d1e12b8f753e?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1757269746970-dc477517268f?w=900&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1755119902709-a53513bcbedc?w=900&auto=format&fit=crop&q=60',
];

const skillIcons = [Target, Palette, Globe, MessageSquare, TrendingUp, BarChart3, Lightbulb, Rocket];
const skillKeys = ['strategy', 'branding', 'seo', 'content', 'growth', 'analytics', 'consulting', 'automation'];

const statValues = ['20+', '1500+', '98%', '3.2x'];
const statKeys = ['years', 'projects', 'satisfaction', 'roi'];

const timelineYears = ['2024', '2020', '2017', '2014', '2004'];

const valueIcons = [Award, Users, TrendingUp, Lightbulb];
const valueKeys = ['excellence', 'partnership', 'results', 'innovation'];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const About = () => {
  const { t, i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title={`${t('about.badge')} — ${t('about.heroTitle')} ${t('about.heroHighlight')}`}
        description={t('about.heroSubtitle')}
        canonical="/about"
        jsonLd={[organizationSchema, personSchema]}
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />
      <AnimatedMarqueeHero
        tagline={t('about.badge')}
        title={
          <>
            {t('about.heroTitle')}{' '}
            <span className="text-primary">{t('about.heroHighlight')}</span>
          </>
        }
        description={t('about.heroSubtitle')}
        ctaText={t('about.heroCta')}
        ctaHref={i18n.language && i18n.language !== 'pt' ? `/${i18n.language}/contact` : '/contact'}
        images={HERO_MARQUEE_IMAGES}
      />

      <ClientFeedback />



      {/* About Me — Story */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center"
          >
            <div className="lg:col-span-2">
              <div className="relative flex items-center justify-center">
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: '340px',
                    height: '340px',
                    borderRadius: '62% 38% 46% 54% / 50% 58% 42% 50%',
                  }}
                >
                  <img src={nunoPhoto} alt="Getboost Digital" className="w-full h-full object-cover grayscale" loading="lazy" />
                </div>
                <div className="absolute -bottom-6 -right-6 z-20">
                  <div
                    className="flex flex-col items-center justify-center shadow-xl p-4"
                    style={{
                      width: '120px',
                      height: '120px',
                      background: 'hsl(15, 100%, 50%)',
                      borderRadius: '50%',
                    }}
                  >
                    <div className="text-3xl font-black leading-none text-white">20+</div>
                    <div className="text-[9px] font-medium text-white/90 text-center mt-1 leading-tight">{t('about.yearsExp')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <span className="text-primary font-semibold text-sm tracking-widest uppercase">{t('about.whoAmI')}</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
                {t('about.transformTitle')} <span className="text-primary">{t('about.transformHighlight')}</span>
              </h2>
              <p className="text-lg leading-relaxed text-foreground/90 mt-6">{t('about.story')}</p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                {t('about.storyExtended')}
              </p>
              <div className="flex items-start gap-4 mt-8 p-5 rounded-xl bg-section-alt border border-border">
                <Quote className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground/80 italic leading-relaxed">
                  "{t('about.quote')}"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-section-alt">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.span variants={fadeUp} custom={0} className="text-primary font-semibold text-sm tracking-widest uppercase">{t('about.valuesLabel')}</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3">{t('about.valuesTitle')}</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-3 max-w-2xl mx-auto">{t('about.valuesSubtitle')}</motion.p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueKeys.map((key, i) => {
              const Icon = valueIcons[i];
              return (
                <motion.div
                  key={key}
                  variants={fadeUp}
                  custom={i + 3}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-7 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t(`about.values.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`about.values.${key}.desc`)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.span variants={fadeUp} custom={0} className="text-primary font-semibold text-sm tracking-widest uppercase">{t('about.skillsLabel')}</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3">{t('about.skills')}</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {skillKeys.map((key, i) => {
              const Icon = skillIcons[i];
              return (
                <motion.div
                  key={key}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-border hover:border-primary/20 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">{t(`about.skillsList.${key}.label`)}</span>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(`about.skillsList.${key}.desc`)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-section-alt">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.span variants={fadeUp} custom={0} className="text-primary font-semibold text-sm tracking-widest uppercase">{t('about.timelineLabel')}</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3">{t('about.timeline')}</motion.h2>
          </motion.div>
          <div className="space-y-0">
            {timelineYears.map((year, i) => (
              <motion.div key={year} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary shrink-0 mt-2 ring-4 ring-primary/10" />
                  {i < timelineYears.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-12">
                  <span className="text-sm font-bold text-primary">{year}</span>
                  <h3 className="text-xl font-bold mt-1">{t(`about.timelineItems.${year}.title`)}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">{t(`about.timelineItems.${year}.desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0">
          <img src={heroWorkspace} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,10,0,0.85) 0%, rgba(255,64,0,0.78) 50%, rgba(26,10,0,0.88) 100%)' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {t('about.ctaTitle')}
            </h2>
            <p className="text-xl text-white/80 font-medium">
              {t('about.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <StandardCTA
                i18nKey="about.ctaCta"
                href="/booking"
                category="about"
                ctaType="bottom_cta"
                size="lg"
                showArrow
                className="bg-white text-primary hover:bg-white/90 rounded-[12px] px-8 py-4 h-auto text-base font-semibold shadow-lg"
              />
              <StandardCTA
                i18nKey="about.ctaSecondaryCta"
                href="/portfolio"
                category="about"
                ctaType="bottom_secondary_cta"
                size="lg"
                variant="outline"
                className="border-2 border-white text-white bg-white/10 hover:bg-white/20 rounded-[12px] px-8 py-4 h-auto text-base font-semibold"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
