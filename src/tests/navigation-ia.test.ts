import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 3B / R18.5 — navigation IA guards.
 *
 * R18.5 premium header: Soluções · Produtos · Recursos · Empresa (+ logo
 * home). The Empresa entry carries the company dropdown (Sobre Nós,
 * Equipa, Portfólio, Carreiras); the company cluster also lives in the
 * footer. CI fails on nav drift, lost service slugs, or broken
 * destinations.
 */

const HEADER = read("src/components/Header.tsx");
const FOOTER = read("src/components/Footer.tsx");
const APP = read("src/App.tsx");

const navBlock = HEADER.slice(
  HEADER.indexOf("const navItems"),
  HEADER.indexOf("];", HEADER.indexOf("const navItems")),
);
const navPaths = [...navBlock.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);

const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

/** All 20 canonical solution slugs that must stay reachable from the mega menu. */
const SOLUTION_SLUGS = [
  "branding-identidade", "marketing-digital", "gestao-redes-sociais", "copywriting-conteudo",
  "seo-geo-webmcp", "paid-media", "email-marketing", "funis-vendas", "landing-pages",
  "video-fotografia", "desenvolvimento-web", "desenvolvimento-mobile", "desenvolvimento-saas",
  "sistemas-gestao-pmes", "integracoes-erp-crm", "ux-ui-design", "mvp-30-dias",
  "agentes-ia", "bots-whatsapp-ia", "crm-sales-intelligence",
];

describe("Wave 3B — navigation IA", () => {
  it("the primary nav is exactly Soluções · Produtos · Recursos · Empresa (home = logo)", () => {
    expect(navPaths).toEqual(["/solucoes", "/produtos", "/insights", "/sobre-nos"]);
  });

  it("every primary nav destination is a real, canonical route", () => {
    for (const path of navPaths) {
      expect(appRoutes, `nav dest ${path}`).toContain(path);
      expect(redirectOnly, `nav dest ${path} is a redirect`).not.toContain(path);
    }
  });

  it("the Empresa dropdown carries the company surfaces (footer cluster intact)", () => {
    // R18.5: company lives in the primary nav as a dropdown AND in the footer.
    for (const companyPath of ["/sobre-nos", "/equipa", "/portfolio", "/carreira"]) {
      expect(HEADER, `header must link ${companyPath}`).toContain(companyPath);
    }
    // …and the company cluster lives in the footer
    expect(FOOTER).toContain("Footer company");
    for (const companyPath of ["/sobre-nos", "/equipa", "/carreira"]) {
      expect(FOOTER, `footer must link ${companyPath}`).toContain(companyPath);
    }
  });

  it("the solutions mega menu is grouped by the four pillars", () => {
    const groupsBlock = HEADER.slice(HEADER.indexOf("const serviceGroups"), HEADER.indexOf("const resourceGroups"));
    for (const pillar of ["'AI'", "'Automation'", "'Software'", "'Growth'"]) {
      expect(groupsBlock, `pillar group ${pillar}`).toContain(pillar);
    }
    // all 20 canonical services remain reachable
    for (const slug of SOLUTION_SLUGS) {
      expect(groupsBlock, `service slug ${slug} lost from the mega menu`).toContain(slug);
    }
  });

  it("the Work hub route is preserved (reachable via footer, sitemap and hubs)", () => {
    // R18.5 removed the Trabalhos nav entry; the /work route itself stays.
    expect(appRoutes).toContain("/work");
    expect(redirectOnly).not.toContain("/work");
  });

  it("the footer mirrors the navigation IA", () => {
    for (const label of ["Footer company", "Footer work", "Footer insights", "Footer products"]) {
      expect(FOOTER, `footer cluster ${label}`).toContain(label);
    }
    expect(FOOTER).toContain("import { PRODUCTS } from '@/data/products'");
    expect(FOOTER).toMatch(/PRODUCTS\.map\(/);
  });

  it("the utility row keeps login, language switcher and the primary CTA", () => {
    expect(HEADER).toContain('to="/login"');
    expect(HEADER).toContain("<LanguageSwitcher");
    // primary CTA → booking (market-aware href), labelled per the R18.5 brief
    expect(HEADER).toContain("bookingHref");
    expect(HEADER).toContain("'/booking'");
    expect(HEADER).toContain("Agendar Diagnóstico");
  });

  it("every product link in the footer strip resolves to its landing route", () => {
    for (const product of PRODUCTS.filter((p) => p.to !== undefined)) {
      expect(appRoutes, `product route ${product.to}`).toContain(product.to);
      expect(FOOTER).toContain("product.to");
    }
    // institutional entries render as spans, never links
    expect(FOOTER).toContain("Institutional entry");
  });
});
