import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { PRODUCTS } from '@/data/products';
import type { StoredAudit } from '@/lib/auditHistory';
import type { Pillar } from './pillarData';

/**
 * Getboost 2027 — Wave 3D · Pillar landing layout.
 *
 * One shared renderer for the four strategic pillars:
 * Hero → Capabilities → Services → Proof → Related products → CTA.
 * Pillar identity is token-driven (colour comes from --gb-<id>-* tokens);
 * orange stays the brand constant; products appear as proof only.
 */

export const PillarLanding = ({ pillar }: { pillar: Pillar }) => {
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const base = `var(--gb-${pillar.id}-base)`;
  const strong = `var(--gb-${pillar.id}-strong)`;
  const tint = `var(--gb-${pillar.id}-tint)`;
  const border = `var(--gb-${pillar.id}-border)`;

  const relatedProducts = PRODUCTS.filter((p) => pillar.products.includes(p.slug));

  return (
    <>
      {/* ============================================================ HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: tint, opacity: 0.5 }}
        />
        <div className="gb-container relative gb-section !pt-36 md:!pt-44">
          <span
            className="gb-eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
            style={{ color: strong, borderColor: border }}
          >
            {pillar.eyebrow}
          </span>
          <h1 className="gb-text-display mt-6 max-w-4xl text-ink-primary">
            {pillar.manifestoLines[0]}{' '}
            <span style={{ color: strong }}>{pillar.manifestoLines[1]}</span>
          </h1>
          <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">{pillar.heroBody}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={() => setContactOpen((v) => !v)}>
              {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setPreloadedAudit(null);
                setAuditOpen(true);
              }}
            >
              <Zap className="h-4 w-4" />
              Auditoria grátis 7 min
            </Button>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== CAPABILITIES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O que entregamos"
            title={`Capacidades ${pillar.name}`}
            description="Cinco frentes de trabalho que combinamos conforme o contexto — nunca pacotes fechados."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillar.capabilities.map((cap, i) => (
              <div key={cap.title} className="gb-surface-card h-full">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: tint, color: strong }}
                >
                  <span className="gb-eyebrow">{String(i + 1).padStart(2, '0')}</span>
                </span>
                <p className="gb-eyebrow mt-5" style={{ color: strong }}>
                  {cap.eyebrow}
                </p>
                <h3 className="gb-text-h3 mt-2 text-ink-primary">{cap.title}</h3>
                <p className="gb-text-body mt-3 text-ink-secondary">{cap.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {cap.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1.5 text-xs text-ink-secondary"
                      style={{ background: tint, border: `1px solid ${border}` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================= SERVICES */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Serviços"
            title={`Tudo o que podes contratar em ${pillar.name.toLowerCase()}`}
            description="Cada serviço tem página própria, com método, entregáveis e preços transparentes."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillar.services.map((service) => (
              <Link key={service.to} to={service.to} className="group block h-full">
                <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                  <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: base }} />
                  <h3 className="gb-text-h3 mt-4 text-ink-primary">{service.title}</h3>
                  <span
                    className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em]"
                    style={{ color: strong }}
                  >
                    Ver serviço <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== PROOF */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Resultados que já existem"
            description="Métricas de projectos em produção — com origem rastreada e dono responsável."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillar.proof.map((p) => (
              <div key={p.k} className="gb-surface-card-elevated h-full">
                <div className="gb-text-display" style={{ color: strong }}>
                  {p.k}
                </div>
                <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================== RELATED PRODUCTS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova de execução"
            title="Produtos que já operam com esta capacidade"
            description="Não só desenhamos sistemas — corremos os nossos próprios, com clientes reais, todos os dias."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((product) => (
              <Link key={product.slug} to={product.to} className="group block h-full">
                <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                  <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                  <h3 className="gb-text-h3 mt-4 text-ink-primary">{product.name}</h3>
                  <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                    Conhecer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="ghost">
              <Link to="/produtos">
                Ver todos os produtos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ======================================================== CTA BAND */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <div className="gb-cta-band text-center">
            <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
              Vamos construir o teu <span style={{ color: '#ff4000' }}>{pillar.name.toLowerCase()}</span>.
            </h2>
            <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
              Conta-nos o contexto e os objectivos — voltamos com um plano
              concreto em menos de 48 horas.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" onClick={() => setContactOpen((v) => !v)}>
                {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary"
                onClick={() => {
                  setPreloadedAudit(null);
                  setAuditOpen(true);
                }}
              >
                <Zap className="h-4 w-4" />
                Auditoria grátis 7 min
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ConsultantContactForm
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        service={{
          slug: pillar.service.slug,
          name: pillar.service.name,
          accent: '#ff4000',
          eyebrow: pillar.service.eyebrow,
          headline: pillar.service.headline,
          subhead: pillar.service.subhead,
          goalOptions: pillar.service.goalOptions,
          messagePlaceholder: pillar.service.messagePlaceholder,
        }}
      />

      <CommercialAuditModal
        open={auditOpen}
        onClose={() => {
          setAuditOpen(false);
          setPreloadedAudit(null);
        }}
        preloaded={preloadedAudit}
      />
    </>
  );
};
