import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const PAGE = read("src/pages/SobreNos.tsx");
const APP = read("src/App.tsx");

/**
 * R19.9 — About consolidation (OPÇÃO A) guards.
 * /about redirects to canonical /sobre-nos; the legacy personal-voice
 * page is gone; /sobre-nos is the premium institutional page on the
 * official catalog and pillars, with conversion preserved.
 */
describe("R19.9 — about consolidation", () => {
  it("/about redirects to /sobre-nos (both market twins)", () => {
    expect(APP).toMatch(/path="\/about"\s+element=\{<Navigate to="\/sobre-nos" replace/);
    expect(APP).toMatch(/path="\/:lang\/about"\s+element=\{<Navigate to="\/:lang\/sobre-nos" replace/);
    expect(APP).not.toMatch(/element=\{<About/);
  });

  it("the legacy personal-voice page is removed", () => {
    expect(existsSync(join(root, "src/pages/About.tsx"))).toBe(false);
    expect(APP).not.toContain('pages/About.tsx');
  });

  it("the redirect is inventoried (host-301 candidate)", () => {
    expect(read("docs/redirect-inventory.md")).toContain("`/about`");
  });

  it("/about is out of the sitemap (canonical URLs only)", () => {
    expect(read("public/sitemap-pages.xml")).not.toContain("/about");
  });

  it("/sobre-nos renders the premium institutional sections in order", () => {
    const markers = [
      "01 HERO", "02 EMPRESA HOJE", "03 CONSTRUÍMOS", "04 MÉTODO",
      "05 ABORDAGEM", "06 PROVA", "07 VISÃO", "08 FINAL CTA",
    ];
    const positions = markers.map((marker) => {
      const at = PAGE.indexOf(marker);
      expect(at, `section ${marker} missing`).toBeGreaterThan(-1);
      return at;
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("company voice throughout — no personal narrative", () => {
    expect(PAGE).not.toMatch(/Sobre Mim/i);
    expect(PAGE).not.toContain("personSchema");
    expect(PAGE).toContain('canonical="/sobre-nos"');
  });

  it("uses the official catalog and pillars (no legacy names)", () => {
    expect(PAGE).toContain("SAAS_PRODUCTS");
    expect(PAGE).toContain("PLATFORM_PRODUCTS");
    expect(PAGE).toContain("SOLUCOES_SUBMENU");
    expect(PAGE).toContain("MARKET_CODES");
    for (const legacy of ["Hostify", "ProSafe360", "Prosafe360"]) {
      const stripped = PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      expect(stripped, `legacy name ${legacy}`).not.toContain(legacy);
    }
  });

  it("institutional CTAs resolve + consultant conversion preserved", () => {
    expect(PAGE).toContain("<ConsultantContactForm");
    expect(PAGE).toContain("slug: 'sobre-nos'");
    for (const dest of ["/solucoes", "/equipa", "/booking", "/contact", "/portfolio", "/produtos", "/casos-de-sucesso"]) {
      expect(PAGE, `CTA ${dest}`).toContain(dest);
    }
  });

  it("runs on the frozen systems (no new animation or style categories)", () => {
    expect(PAGE).toContain("import { SectionHeader }");
    expect(PAGE).toContain("import { Button }");
    expect(PAGE).toContain("import { MiniFlow }");
    expect(PAGE).toContain("import { CountUp }");
    expect(PAGE).toContain("gb-card-lift");
    expect(PAGE).toContain("reduceMotion ? undefined");
    expect(PAGE).not.toContain("setInterval");
  });
});
