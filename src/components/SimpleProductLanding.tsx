import { motion } from 'framer-motion';
import { Check, ArrowRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import PageHero from '@/components/PageHero';
import { Card, CardContent } from '@/components/ui/card';
import { StandardCTA } from '@/components/StandardCTA';

export interface SimpleProductLandingProps {
  seo: { title: string; description: string; canonical?: string };
  hero: {
    badge: string;
    title: string;
    highlight?: string;
    subtitle?: string;
    description?: string;
    backgroundImage: string;
    checkmarks?: string[];
    ctaLabel: string;
    ctaHref?: string;
  };
  intro?: { eyebrow?: string; heading: string; body: string };
  benefits: { title: string; desc: string; icon: LucideIcon }[];
  features?: string[];
  finalCta?: { title: string; subtitle?: string; label: string; href?: string };
  analyticsCategory: string;
}

export default function SimpleProductLanding({
  seo,
  hero,
  intro,
  benefits,
  features,
  finalCta,
  analyticsCategory,
}: SimpleProductLandingProps) {
  return (
    <Layout>
      <SEO title={seo.title} description={seo.description} canonical={seo.canonical} />

      <PageHero
        badge={hero.badge}
        title={hero.title}
        highlight={hero.highlight}
        subtitle={hero.subtitle}
        description={hero.description}
        backgroundImage={hero.backgroundImage}
        checkmarks={hero.checkmarks}
        cta={{
          i18nKey: hero.ctaLabel,
          label: hero.ctaLabel,
          href: hero.ctaHref ?? '/contact',
          category: analyticsCategory,
          ctaType: 'primary_hero',
        }}
      />

      {intro && (
        <section className="py-20 md:py-28 bg-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            {intro.eyebrow && (
              <p className="text-sm font-semibold tracking-[0.14em] uppercase text-primary mb-4">
                {intro.eyebrow}
              </p>
            )}
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-foreground mb-6">
              {intro.heading}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {intro.body}
            </p>
          </div>
        </section>
      )}

      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Benefícios que se sentem no dia-a-dia
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
              >
                <Card className="h-full border-border/60 hover:border-primary/60 hover:shadow-lg transition-all">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{b.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {features && features.length > 0 && (
        <section className="py-20 md:py-28 bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-center mb-12">
              Tudo o que precisas, num só sistema
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {finalCta && (
        <section className="py-20 md:py-28 bg-primary/5">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
              {finalCta.title}
            </h2>
            {finalCta.subtitle && (
              <p className="text-lg text-muted-foreground mb-10">{finalCta.subtitle}</p>
            )}
            <StandardCTA
              i18nKey={finalCta.label}
              href={finalCta.href ?? '/contact'}
              category={analyticsCategory}
              ctaType="final_cta"
              showArrow
            >
              {finalCta.label}
            </StandardCTA>
          </div>
        </section>
      )}
    </Layout>
  );
}
