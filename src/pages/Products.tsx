import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes } from 'lucide-react';
import Layout from '@/components/Layout';
import { analytics } from '@/lib/analytics';
import { ScrollDepth } from '@/components/ScrollDepth';
import SEO, { SITE_URL } from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { PRODUCTS, SAAS_PRODUCTS, PLATFORM_PRODUCTS } from '@/data/products';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoPikto from '@/assets/logos/logo-pikto.svg';
import { fadeUp } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

const PRODUCT_LOGOS: Record<string, string> = {
  qook: logoQook,
  motivae: logoMotivae,
  pikto: logoPikto,
};

/** ItemList of the routable products on canonical routes — structured data stays valid. */
const productsSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Produtos Getboost',
  itemListElement: PRODUCTS.filter((p) => p.to).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    description: p.tagline ?? p.name,
    url: `${SITE_URL}${p.to as string}`,
  })),
};

/**
 * Getboost 2027 — R19.8 · Products hub on the official catalog:
 * PRODUTOS SAAS (routable cards) + PLATAFORMAS (institutional
 * representation, never links). Routes, structured data validity
 * and SEO integrity preserved.
 */
const Products = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="products" />
      <SEO
        title="Produtos — software que a Getboost constrói e opera"
        description="Conhece o ecossistema Getboost: Qook, Motivae, Alojify, Pikto, Trackfy e Safely, mais as plataformas Descobre Quem Tu És e Guia Cities. Software real, com utilizadores reais."
        canonical="/produtos"
        lang={i18n.language as 'pt' | 'en' | 'es'}
        jsonLd={productsSchema}
      />

      {/* ============================================================ HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-36 md:!pt-44">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="gb-eyebrow inline-flex items-center gap-2 rounded-full border border-sand-200 px-3 py-1.5 text-brand-600">
              <Boxes className="h-3.5 w-3.5" />
              Ecossistema Getboost
            </span>
            <h1 className="gb-text-display mt-6 max-w-4xl text-ink-primary">
              Não só construímos software.{' '}
              <span className="text-brand-600">Operamo-lo todos os dias.</span>
            </h1>
            <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">
              O ecossistema de software da Getboost — cada produto nasceu de
              um problema de negócio concreto. É a mesma engenharia que
              aplicamos no projecto que vamos construir contigo.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`}>
                  Falar com um consultor
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/solucoes">
                  Ver soluções <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== PRODUTOS SAAS */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Produtos SaaS"
            title="Software como serviço, em produção"
            description="Cada produto começou como um briefing real. Explora o que fazem e para quem são."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SAAS_PRODUCTS.filter((p) => p.to && p.tagline).map((product, i) => {
              const logo = PRODUCT_LOGOS[product.slug];
              return (
                <motion.div
                  key={product.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'products_hub')}>
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
                      <div className="mt-5 flex h-12 items-center">
                        {logo ? (
                          <img
                            src={logo}
                            alt={product.name}
                            className="h-8 w-auto object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="gb-eyebrow text-ink-tertiary">{product.name}</span>
                        )}
                      </div>
                      {product.category && (
                        <p className="gb-eyebrow mt-4 text-ink-tertiary">{product.category}</p>
                      )}
                      <h2 className="gb-text-h3 mt-2 text-ink-primary">{product.name}</h2>
                      <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                      {product.description && (
                        <p className="gb-text-body mt-4 text-ink-secondary">{product.description}</p>
                      )}
                      <span className="gb-link-more mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                        Conhecer o {product.name}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== PLATAFORMAS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Plataformas"
            title="O ecossistema continua a crescer"
            description="Representação institucional das plataformas Getboost."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {PLATFORM_PRODUCTS.map((product, i) => (
              <motion.div
                key={product.slug}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                {/* Institutional entry: representation only, never a link. */}
                <div className="gb-surface-card h-full">
                  <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                  <div className="mt-5 flex h-12 items-center">
                    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white" style={{ background: product.accent }}>
                      {product.name.charAt(0)}
                    </span>
                  </div>
                  <p className="gb-eyebrow mt-4 text-ink-tertiary">Plataforma</p>
                  <h2 className="gb-text-h3 mt-2 text-ink-primary">{product.name}</h2>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== CTA BAND */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={PRODUCTS.length}>
            <div className="gb-cta-band text-center">
              <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                O teu projecto não está{' '}
                <span style={{ color: ACCENT }}>nesta lista?</span>
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Estes produtos nasceram de briefings reais. O próximo pode ser o
                teu — contamos-te o contexto, os objectivos e o prazo.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`}>
                    Falar com um consultor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                  <Link to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`}>
                    Agendar reunião <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
