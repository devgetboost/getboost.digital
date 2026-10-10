import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO, { SITE_URL } from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { PRODUCTS } from '@/data/products';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoHostify from '@/assets/logos/logo-hostify.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoPikto from '@/assets/logos/logo-pikto.svg';
import logoProsafe360 from '@/assets/logos/logo-prosafe360.svg';

const ACCENT = '#ff4000';

const PRODUCT_LOGOS: Record<string, string> = {
  qook: logoQook,
  hostify: logoHostify,
  motivae: logoMotivae,
  pikto: logoPikto,
  prosafe360: logoProsafe360,
};

/** ItemList of the six products on canonical routes — the hub's proof role. */
const productsSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Produtos Getboost',
  itemListElement: PRODUCTS.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    description: p.tagline,
    url: `${SITE_URL}${p.to}`,
  })),
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * Getboost 2027 — Wave 3E · Products hub, migrated to the Wave 3A design
 * system (was the pre-system dark build from Wave 2A.5). Routes, product
 * data, structured data and SEO are unchanged.
 */
const Products = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Produtos — software que a Getboost constrói e opera"
        description="Conhece os produtos Getboost: Qook para restauração, Hostify para alojamento local, Motivae, Pikto, Trackfy e ProSafe360. Software real, com utilizadores reais."
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
              Produtos Getboost
            </span>
            <h1 className="gb-text-display mt-6 max-w-4xl text-ink-primary">
              Não só construímos software.{' '}
              <span className="text-brand-600">Operamo-lo todos os dias.</span>
            </h1>
            <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">
              Seis produtos a correr em produção, com clientes reais — cada um
              nasceu de um problema de negócio concreto. É a mesma engenharia
              que aplicamos no projecto que vamos construir contigo.
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

      {/* ==================================================== PRODUCT GRID */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O portefólio de produto"
            title="Seis produtos, seis problemas resolvidos"
            description="Cada produto começou como um briefing real. Explora o que fazem e para quem são."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => {
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
                  <Link to={product.to} className="group block h-full">
                    <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                      <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
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
                      <h2 className="gb-text-h3 mt-4 text-ink-primary">{product.name}</h2>
                      <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                      <p className="gb-text-body mt-4 text-ink-secondary">{product.description}</p>
                      <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
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
