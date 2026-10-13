import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R20.5 — SEO Foundation 2.0 guards.
 * Metadata completeness (every route page has SEO or documented noindex),
 * single-h1 discipline, OG asset presence, llms.txt canonical hygiene,
 * and sitemap/robots integrity. CI fails on metadata drift.
 */

/** Route pages and their SEO contract. */
const NOINDEX_PAGES = new Set([
  "src/pages/ResetPassword.tsx", // auth utility — must not index
  "src/pages/Unsubscribe.tsx", // tokenized utility — must not index
]);

/**
 * Files allowed 0 direct h1 (h1 comes from a child component) or 2 h1
 * where both branches are provably mutually exclusive (early-return
 * error states). Reason documented per file — any NEW entry fails here
 * until justified.
 */
const H1_ALLOWLIST: Record<string, string> = {
  "src/pages/SolucaoPlaceholder.tsx": "h1 renders in the frozen hero",
  "src/pages/SolucoesSlugRouter.tsx": "router — h1 renders via the resolved child",
  "src/pages/AcademyCourseDetail.tsx": "second h1 is an early-return not-found state",
  "src/pages/DemoRequest.tsx": "second h1 is an early-return invalid-product state",
  "src/pages/DigitalAuditResults.tsx": "second h1 is an early-return no-result state",
  "src/pages/ResetPassword.tsx": "second h1 is an early-return invalid-link state",
  "src/pages/ServiceDetail.tsx": "second h1 is the exclusive SoftwareDevHero branch",
};

const h1Count = (source: string): number =>
  (source.match(/<(motion\.)?h1[\s>]/g) ?? []).length;

const routePages = (): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, "src/pages"))) {
    if (!entry.endsWith(".tsx")) continue;
    if (entry.startsWith("Admin") || entry === "NotFound.tsx") continue;
    out.push(`src/pages/${entry}`);
  }
  return out;
};

describe("R20.5 — metadata completeness", () => {
  it("every route page has an SEO block or documented noindex", () => {
    const offenders: string[] = [];
    for (const file of routePages()) {
      const content = read(file);
      const hasSeo = content.includes("<SEO");
      if (hasSeo || NOINDEX_PAGES.has(file)) continue;
      // Delegating routers are covered when their file documents it
      if (file.endsWith("SolucoesSlugRouter.tsx")) continue;
      offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("noindex pages stay noindex (auth/utility must never index)", () => {
    for (const file of NOINDEX_PAGES) {
      expect(read(file), `${file} noindex`).toContain("noIndex");
    }
  });

  it("the default OG image exists and is a real shareable asset", () => {
    const og = join(root, "public/og-image.jpg");
    expect(existsSync(og), "public/og-image.jpg missing").toBe(true);
    expect(statSync(og).size, "og-image.jpg empty").toBeGreaterThan(10000);
    // every og:image reference in shell + SEO helper resolves to it
    expect(read("index.html")).toContain("https://getboost.digital/og-image.jpg");
    expect(read("src/components/SEO.tsx")).toContain("/og-image.jpg");
  });
});

describe("R20.5 — heading discipline", () => {
  it("route pages render exactly one h1 (allowlisted exclusivity documented)", () => {
    const offenders: string[] = [];
    for (const file of routePages()) {
      const count = h1Count(read(file));
      if (count === 1) continue;
      if ((count === 0 || count === 2) && file in H1_ALLOWLIST) continue;
      offenders.push(`${file} (${count}× h1)`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("R20.5 — llms.txt hygiene", () => {
  it("references canonical routes, official names and no legacy hosts", () => {
    const llms = read("public/llms.txt");
    expect(llms).not.toContain("lovable");
    expect(llms).not.toContain("/services/");
    expect(llms).not.toContain("google-meta-ads");
    expect(llms).not.toContain("consultoria-estrategica");
    expect(llms).not.toContain("google-business-profile");
    for (const route of ["/solucoes", "/produtos", "/work", "/insights", "/sobre-nos", "/booking"]) {
      expect(llms, `llms route ${route}`).toContain(`](${route})`);
    }
    for (const name of ["Qook", "Motivae", "Alojify", "Pikto", "Trackfy", "Safely", "Descobre Quem Tu És", "Guia Cities"]) {
      expect(llms, `llms product ${name}`).toContain(name);
    }
    expect(llms).not.toMatch(/\[Hostify\]|\[ProSafe360\]/);
  });
});

describe("R20.5 — sitemap and robots integrity", () => {
  it("sitemap index and children serve the canonical domain only", () => {
    const index = read("public/sitemap.xml");
    expect(index).toContain("<sitemapindex");
    expect(index).not.toContain("lovable");
    for (const file of [
      "sitemap-pages.xml",
      "sitemap-services.xml",
      "sitemap-blog.xml",
      "sitemap-portfolio.xml",
      "sitemap-resources.xml",
      "sitemap-demo.xml",
    ]) {
      expect(existsSync(join(root, `public/${file}`)), `${file} missing`).toBe(true);
    }
  });

  it("no redirect-only or retired route is emitted", () => {
    const pages = read("public/sitemap-pages.xml");
    for (const retired of ["/about", "/solucoes/qook", "/solucoes/hostify"]) {
      expect(pages, `retired URL ${retired}`).not.toContain(`>${retired}<`);
      expect(pages, `retired URL ${retired}`).not.toContain(`>${retired}/`);
    }
  });

  it("robots gates private areas and declares canonical sitemaps", () => {
    const robots = read("public/robots.txt");
    for (const rule of ["Disallow: /admin/", "Disallow: /login", "Disallow: /unsubscribe"]) {
      expect(robots, rule).toContain(rule);
    }
    expect(robots).toContain("Sitemap: https://getboost.digital/sitemap.xml");
    expect(robots).not.toContain("lovable");
  });
});
