import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 3B — navigation IA guards.
 *
 * The frozen primary navigation is Home · Solutions · Work · Products ·
 * Insights · Contact (GETBOOST_2027_DESIGN_FREEZE_V1); COMPANY is
 * footer-only. CI fails on nav drift, company creeping back into the
 * primary nav, lost service slugs, or broken destinations.
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
  it("the primary nav is exactly the frozen five destinations (home = logo)", () => {
    expect(navPaths).toEqual(["/solucoes", "/work", "/produtos", "/insights", "/contact"]);
  });

  it("every primary nav destination is a real, canonical route", () => {
    for (const path of navPaths) {
      expect(appRoutes, `nav dest ${path}`).toContain(path);
      expect(redirectOnly, `nav dest ${path} is a redirect`).not.toContain(path);
    }
  });

  it("COMPANY is footer-only — no company route in the primary nav", () => {
    for (const companyPath of ["/sobre-nos", "/equipa", "/carreira"]) {
      expect(navBlock, `primary nav must not link ${companyPath}`).not.toContain(companyPath);
    }
    // …and the company cluster lives in the footer
    expect(FOOTER).toContain("Footer company");
    for (const companyPath of ["/sobre-nos", "/equipa", "/carreira"]) {
      expect(FOOTER, `footer must link ${companyPath}`).toContain(companyPath);
    }
  });

  it("the solutions mega menu is grouped by the four pillars", () => {
    const groupsBlock = HEADER.slice(HEADER.indexOf("const serviceGroups"), HEADER.indexOf("const workGroups"));
    for (const pillar of ["'IA'", "'Automação'", "'Software'", "'Growth'"]) {
      expect(groupsBlock, `pillar group ${pillar}`).toContain(pillar);
    }
    // all 20 canonical services remain reachable
    for (const slug of SOLUTION_SLUGS) {
      expect(groupsBlock, `service slug ${slug} lost from the mega menu`).toContain(slug);
    }
  });

  it("the Work and Insights entries exist with their surfaces", () => {
    expect(HEADER).toContain("const workGroups");
    expect(HEADER).toContain("/casos-de-sucesso");
    expect(HEADER).toContain("/portfolio");
    // caso-de-sucesso moved from the resources mega to Work
    const resourcesBlock = HEADER.slice(HEADER.indexOf("const resourceGroups"), HEADER.indexOf("const productGroups"));
    expect(resourcesBlock).not.toContain("casos-de-sucesso");
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
    // primary CTA → booking
    expect(HEADER).toMatch(/to=\{i18n\.language === 'pt' \? '\/booking' : `\/\$\{i18n\.language\}\/booking`\}/);
  });

  it("every product link in the footer strip resolves to its landing route", () => {
    for (const product of PRODUCTS) {
      expect(appRoutes, `product route ${product.to}`).toContain(product.to);
      expect(FOOTER).toContain("product.to");
    }
  });
});
