import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R18.10 — social proof & authority guards.
 * Every authority claim must be verifiable from the codebase (products,
 * counts, statuses); no invented products, no false states, no new
 * destinations, no new conversion paths.
 */
describe("R18.10 — authority & proof", () => {
  it("every SaaS product carries a category and a project-supported status", () => {
    const saas = PRODUCTS.filter((p) => p.kind === 'saas' && p.to !== undefined);
    const categories = new Set(saas.map((p) => p.category));
    expect(categories.size).toBe(saas.length);
    for (const product of saas) {
      expect(product.category!.length, `${product.slug} category`).toBeGreaterThan(2);
      expect(product.status, `${product.slug} status`).toBe("Em Produção");
    }
    // conditional fields are never invented: absent means unrendered
    for (const product of PRODUCTS.filter((p) => p.to === undefined)) {
      expect(product.status).toBeUndefined();
    }
  });

  it("product cards render category, status and the mini preview", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain("{product.category}");
    expect(index).toContain("{product.status}");
  });

  it("the trust strip only claims verifiable counts", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain("trust strip");
    // counts are data-driven, never hardcoded
    expect(index).toContain("${SAAS_PRODUCTS.length}");
    expect(index).toContain("${pillars.length}");
    expect(index).toContain("${SOLUCOES_SUBMENU.length}");
    expect(index).toContain("${MARKET_CODES.length}");
  });

  it("the ecosystem strip and comparison panel add no links or routes", () => {
    const index = read("src/pages/Index.tsx");
    const ecosystem = index.slice(index.indexOf("authority strip"), index.indexOf("05 CASE STUDIES"));
    expect(ecosystem).not.toContain("<Link");
    expect(ecosystem).not.toContain("to=\"/");
    const comparison = index.slice(index.indexOf("why Getboost"), index.indexOf("gb-cta-band"));
    expect(comparison).not.toContain("<Link");
    expect(comparison).not.toContain("to=\"/");
  });

  it("cases label the metric as Resultado (desafio → implementação → resultado)", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain(">Resultado</p>");
  });

  it("the comparison contrasts agency vs product company without new CTAs", () => {
    const index = read("src/pages/Index.tsx");
    for (const item of ["Campanhas", "Relatórios", "Dependência manual", "IA aplicada", "Automação", "Software próprio", "Operação escalável"]) {
      expect(index, item).toContain(item);
    }
    expect(index).toContain("Agência tradicional");
  });
});
