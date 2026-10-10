import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PILLARS } from "../components/pillars/pillarData";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 3D — pillar experience guards.
 *
 * The four strategic pillars render through one shared layout, with
 * token-driven colour identity, canonical services, and products as
 * proof. CI fails on a pillar losing its route, its services, its
 * colour tokens, or its conversion mechanics.
 */

const APP = read("src/App.tsx");
const LANDING = read("src/components/pillars/PillarLanding.tsx");

const PILLAR_ROUTES: Record<string, { route: string; component: string; page: string }> = {
  ai: { route: "/agentes-ia", component: "AgentesIA", page: "src/pages/AgentesIA.tsx" },
  automation: { route: "/solucoes/integracoes-erp-crm", component: "IntegracoesErpCrm", page: "src/pages/IntegracoesErpCrm.tsx" },
  software: { route: "/solucoes/desenvolvimento-software", component: "DesenvolvimentoSaaS", page: "src/pages/DesenvolvimentoSaaS.tsx" },
  growth: { route: "/solucoes/marketing-digital", component: "MarketingDigital", page: "src/pages/MarketingDigital.tsx" },
};

/** Every canonical /solucoes/* (and standalone) service route. */
const ALL_SERVICE_ROUTES = [
  "/agentes-ia",
  "/crm-sales-intelligence",
  "/solucoes/bots-whatsapp-ia",
  "/solucoes/integracoes-erp-crm",
  "/solucoes/funis-vendas",
  "/solucoes/sistemas-gestao-pmes",
  "/solucoes/email-marketing",
  "/solucoes/desenvolvimento-web",
  "/solucoes/desenvolvimento-mobile",
  "/solucoes/desenvolvimento-software",
  "/solucoes/ux-ui-design",
  "/solucoes/mvp-30-dias",
  "/solucoes/marketing-digital",
  "/solucoes/paid-media",
  "/solucoes/seo-geo-webmcp",
  "/solucoes/gestao-redes-sociais",
  "/solucoes/copywriting-conteudo",
  "/solucoes/branding-identidade",
  "/solucoes/video-fotografia",
  "/solucoes/landing-pages",
];

const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

describe("Wave 3D — pillar experiences", () => {
  it("every pillar mounts its shared layout on its canonical route", () => {
    for (const [id, spec] of Object.entries(PILLAR_ROUTES)) {
      const page = read(spec.page);
      expect(page, `${spec.page} must render the pillar landing`).toContain("<PillarLanding pillar={PILLARS." + id + "}");
      expect(page, `${spec.page} must keep its SEO`).toContain(`canonical="${spec.route}"`);
      expect(APP, `route for ${id}`).toMatch(new RegExp(`path="${spec.route}"\\s+element=\\{<${spec.component}`));
    }
  });

  it("every pillar surface uses its token colour identity", () => {
    // colour comes from tokens via the pillar id — no hardcoded pillar hexes
    for (const facet of ["base", "strong", "tint", "border"]) {
      expect(LANDING, `facet ${facet}`).toContain(`var(--gb-\${pillar.id}-${facet})`);
    }
    // the only literal colour allowed in the layout is the brand orange
    expect(LANDING).toContain("#ff4000");
    for (const hex of ["#7c3aed", "#0d9488", "#2563eb", "#16a34a"]) {
      expect(LANDING, `pillar hex ${hex} must not be hardcoded`).not.toContain(hex);
    }
  });

  it("all four pillars are defined with five capabilities each (copy preserved)", () => {
    for (const pillar of Object.values(PILLARS)) {
      expect(pillar.capabilities.length, `${pillar.id} capabilities`).toBe(5);
      expect(pillar.proof.length, `${pillar.id} proof`).toBe(3);
      for (const cap of pillar.capabilities) {
        expect(cap.title.length).toBeGreaterThan(5);
        expect(cap.tags.length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("all twenty services are preserved across the pillar service lists", () => {
    const routes = Object.values(PILLARS).flatMap((p) => p.services.map((s) => s.to));
    expect(new Set(routes).size).toBe(20);
    expect([...new Set(routes)].sort()).toEqual([...ALL_SERVICE_ROUTES].sort());
    for (const route of routes) {
      expect(appRoutes, `service route ${route}`).toContain(route);
      expect(redirectOnly, `service route ${route} must be canonical`).not.toContain(route);
    }
  });

  it("products remain proof — every related product resolves to its landing", () => {
    const productSlugs = new Set(PRODUCTS.map((p) => p.slug));
    for (const pillar of Object.values(PILLARS)) {
      expect(pillar.products.length, `${pillar.id} related products`).toBeGreaterThanOrEqual(1);
      for (const slug of pillar.products) {
        expect(productSlugs.has(slug), `${slug} must be a real product`).toBe(true);
        const product = PRODUCTS.find((p) => p.slug === slug)!;
        expect(appRoutes, `product route ${product.to}`).toContain(product.to);
      }
    }
  });

  it("the shared layout adopts the design system and conversion mechanics", () => {
    expect(LANDING).toContain("import { SectionHeader } from '@/components/ui/section-header'");
    expect((LANDING.match(/<SectionHeader/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(LANDING).toContain("<CommercialAuditModal");
    expect(LANDING).toContain("<ConsultantContactForm");
    for (const cls of ["gb-surface-page", "gb-surface-section", "gb-surface-card", "gb-surface-card-elevated", "gb-cta-band", "gb-container"]) {
      expect(LANDING, `layout must use ${cls}`).toContain(cls);
    }
  });
});
