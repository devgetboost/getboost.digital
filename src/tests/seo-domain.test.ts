import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const SITE = "https://getboost.digital";

/**
 * Wave 2A.3 — canonical host + single schema identity.
 *
 * The retired preview host (getboostsoft.lovable.app) was baked into the
 * browser shell, the SEO component, the sitemap generator, robots.txt and a
 * page-level JSON-LD block. These guards make any reappearance fail CI:
 * the ban covers src/ (guards excluded — they name the host negatively),
 * scripts/, index.html and every generated sitemap artifact.
 */
const BANNED = ["getboostsoft", "lovable.app", "geral@getboost.digital"];

const SITEMAP_FILES = [
  "sitemap.xml",
  "sitemap-pages.xml",
  "sitemap-blog.xml",
  "sitemap-services.xml",
  "sitemap-portfolio.xml",
  "sitemap-resources.xml",
  "sitemap-demo.xml",
];

/** XML namespace hosts — not site URLs, exempt from the canonical check. */
const NAMESPACE_HOSTS = new Set(["www.sitemaps.org", "www.w3.org", "schema.org"]);

/** Absolute site URLs inside an XML artifact whose host is not canonical. */
function nonCanonicalUrls(xml: string): string[] {
  return [...xml.matchAll(/https?:\/\/[^<"'\s]+/g)]
    .map((m) => m[0])
    .filter((url) => {
      let host: string;
      try {
        host = new URL(url).hostname;
      } catch {
        return true;
      }
      return host !== "getboost.digital" && !NAMESPACE_HOSTS.has(host);
    });
}

/** Recursively lists scannable files under a directory. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      out.push(...listFiles(rel));
      continue;
    }
    if (/\.(test|spec)\.tsx?$/.test(entry.name)) continue; // guards may name the host
    if (!/\.(ts|tsx|js|mjs|html|json|txt|xml)$/.test(entry.name)) continue;
    out.push(rel);
  }
  return out;
}

describe("Wave 2A.3 — canonical host (getboost.digital)", () => {
  it("defines the canonical site host exactly once, exported for consumers", () => {
    const seo = read("src/components/SEO.tsx");
    expect(seo).toContain(`export const SITE_URL = '${SITE}'`);
    expect(seo.match(/const SITE_URL =/g)).toHaveLength(1);
  });

  it.each(["index.html", "scripts/generate-sitemap.js", "public/robots.txt", "public/llms.txt"])(
    "%s targets the canonical host only",
    (file) => {
      const content = read(file).toLowerCase();
      for (const banned of BANNED) expect(content).not.toContain(banned);
    },
  );

  it("no source file under src/ or scripts/ references the retired host or the retired email", () => {
    const offenders = [...listFiles("src"), ...listFiles("scripts")].filter((rel) => {
      const content = read(rel).toLowerCase();
      return BANNED.some((banned) => content.includes(banned));
    });
    expect(offenders).toEqual([]);
  });

  it.each(SITEMAP_FILES)("%s uses only the canonical host", (file) => {
    expect(existsSync(join(root, `public/${file}`)), `${file} missing`).toBe(true);
    const content = read(`public/${file}`);
    expect(content).not.toContain("getboostsoft");
    const urls = [...content.matchAll(/https?:\/\/[^<"'\s]+/g)].map((m) => m[0]);
    expect(urls.length).toBeGreaterThan(0);
    expect(nonCanonicalUrls(content)).toEqual([]);
  });

  it("robots.txt declares sitemaps on the canonical host", () => {
    const directives = read("public/robots.txt")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^sitemap:/i.test(l));
    expect(directives.length).toBeGreaterThan(0);
    for (const directive of directives) {
      expect(directive.toLowerCase().startsWith(`sitemap: ${SITE}/`)).toBe(true);
    }
  });

  it("index.html shell metadata (og:url, og:image, twitter:image, JSON-LD) targets the canonical host", () => {
    const html = read("index.html");
    expect(html).toContain(`<meta property="og:url" content="${SITE}/"`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og-image.jpg"`);
    expect(html).toContain(`<meta name="twitter:image" content="${SITE}/og-image.jpg"`);
    expect(html).toContain('"@type":"Organization","name":"Getboost Digital"');
    expect(html).not.toContain("getboostsoft");
  });

  it("DemoRequest JSON-LD block targets the canonical host via the shared constant", () => {
    const demo = read("src/pages/DemoRequest.tsx");
    expect(demo).not.toContain("getboostsoft");
    expect(demo).not.toContain("SITE_URL_DEMO");
    expect(demo).toContain("import SEO, { SITE_URL }");
  });

  it("ships one Organization identity with one contact email and no Spain market", () => {
    const seo = read("src/components/SEO.tsx");
    expect(seo).toContain("name: 'Getboost Digital'");
    // The schema contact point is the single business email; the retired
    // geral@ address must never return. Wave 2A.4: it reads from the registry.
    expect(seo).toContain("email: CONTACT.email");
    expect(seo).not.toContain("geral@getboost.digital");
    for (const file of ["src/components/SEO.tsx", "src/pages/DemoRequest.tsx"]) {
      const content = read(file);
      expect(content, `${file} must not claim a Spain market`).not.toMatch(/areaServed:[^\]]*'Spain'/);
    }
  });

  it("the Organization logo points at an asset that exists", () => {
    const seo = read("src/components/SEO.tsx");
    const logo = seo.match(/url: `\$\{SITE_URL\}\/(apple-touch-icon\.png|og-image\.jpg)`/)?.[1];
    expect(logo, "Organization logo must be a real public asset").toBeTruthy();
    expect(existsSync(join(root, `public/${logo}`))).toBe(true);
  });

  it("person schema describes the founder, not the company", () => {
    const seo = read("src/components/SEO.tsx");
    const person = seo.slice(seo.indexOf("export const personSchema"));
    expect(person).toMatch(/name: 'Nuno Cruz'/);
    expect(person).not.toContain("assets/nuno-cruz.webp");
  });
});
