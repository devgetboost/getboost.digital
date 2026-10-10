import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { BRAND, CONTACT, FOUNDER, METRICS, ROLE_EMAILS } from "../data/brandRegistry";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 2A.4 — Brand Registry consistency.
 *
 * Three conflicting project counts (30+ / 500+ / 1500+) and two contact
 * emails shipped simultaneously before this registry. These guards fail CI on:
 *   - a project-count or years claim that differs from the registry,
 *   - a hardcoded phone / email / street address in code,
 *   - a consumer surface that stops reading from the registry.
 */

const REGISTRY_FILE = "src/data/brandRegistry.ts";
const PROJECT_COUNT = METRICS.projectsDelivered.value; // '30+'
const YEARS = METRICS.yearsExperience.value; // '20+'

/** Numeric core of a registry claim, for comparison: '30+' -> '30'. */
const numericCore = (claim: string) => claim.replace(/[^\d]/g, "");

/** Code files: everything under src/ except tests and the registry itself. */
function codeFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      if (/\.(test|spec)\.tsx?$/.test(entry.name)) continue;
      if (rel === REGISTRY_FILE) continue;
      out.push(rel);
    }
  };
  walk("src");
  return out;
}

/**
 * Metrics-class project-count claims in any language: "30+ projetos",
 * "500 projects", "1500 proyectos". Single-digit sample copy ("8 projectos"
 * in a WhatsApp template) is not a metrics claim and is excluded.
 */
function projectClaims(text: string): string[] {
  const withPlus = /([+]?\s*\d[\d.,]*\s*[+])\s*(?:projetos|projectos|proyectos|projects)/gi;
  const big = /(\b\d{2,}[\d.,]*)\s*(?:projetos|projectos|proyectos|projects)/gi;
  return [
    ...[...text.matchAll(withPlus)].map((m) => m[1].trim()),
    ...[...text.matchAll(big)].map((m) => m[1].trim()),
  ];
}

/** Years claims in pt/en/es prose. */
function yearsClaims(text: string): string[] {
  return [...text.matchAll(/(\d+)\s*(?:anos|años|years)/gi)].map((m) => m[1]);
}

describe("Wave 2A.4 — Brand Registry (Single Source of Truth)", () => {
  it("the registry carries every required fact", () => {
    expect(PROJECT_COUNT).toMatch(/^\d+\+$/);
    expect(YEARS).toMatch(/^\d+\+$/);
    expect(METRICS.projectsDelivered.label.pt).toBe("Projetos entregues");
    expect(METRICS.yearsExperience.label.pt).toBe("Anos de experiência");
    expect(CONTACT.phone.display).toContain("963");
    expect(CONTACT.phone.e164).toMatch(/^\+\d{10,}$/);
    expect(CONTACT.email).toMatch(/^[^@]+@getboost\.digital$/);
    expect(CONTACT.address.street.length).toBeGreaterThan(10);
    expect(CONTACT.address.postalCode).toMatch(/^\d{4}-\d{3}$/);
    expect(CONTACT.address.locality).toBe("Figueira da Foz");
    expect(BRAND.name).toBe("Getboost Digital");
    expect(FOUNDER.email).toMatch(/@getboost\.digital$/);
  });

  it("every consumer surface reads from the registry", () => {
    const consumers = [
      "src/pages/Index.tsx",
      "src/pages/About.tsx",
      "src/components/Footer.tsx",
      "src/components/SEO.tsx",
      "src/pages/Contact.tsx",
      "src/pages/AgenciaLocal.tsx",
      "src/components/BlogShareContact.tsx",
      "src/pages/DemoRequest.tsx",
      "src/pages/ProjetoInvestidor.tsx",
      "src/lib/whatsappMessages.ts",
    ];
    for (const file of consumers) {
      expect(read(file), `${file} must import the brand registry`).toContain("brandRegistry");
    }
  });

  it("code files contain no hardcoded project counts or years claims", () => {
    const offenders = codeFiles().filter((file) => {
      const content = read(file);
      return projectClaims(content).length > 0 || /mais de \d+ anos|over \d+ years|m.s de \d+ a.os/i.test(content);
    });
    expect(offenders).toEqual([]);
  });

  it("code files contain no hardcoded phone numbers", () => {
    const offenders = codeFiles().filter((file) => /963\s*574\s*400|963574400/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it("code files only use registry-owned emails", () => {
    const allowed = new Set([CONTACT.email, FOUNDER.email, ...Object.values(ROLE_EMAILS)]);
    for (const file of codeFiles()) {
      const emails = [...read(file).matchAll(/[\w.+-]+@getboost\.digital/g)].map((m) => m[0]);
      for (const email of emails) {
        // Synthetic scenario addresses (scenario+<ts>@...) are fixtures, not
        // contact data; everything else must be registry-owned.
        if (/^scenario\+/.test(email)) continue;
        expect(allowed.has(email), `${file} email ${email} must come from the registry`).toBe(true);
      }
    }
  });

  it("no code file re-states the street address", () => {
    for (const file of codeFiles()) {
      // The maps URL-encoded form ("R.+Passeio+Infante+...") is a link, not a
      // re-statement; the human-readable address belongs to the registry only.
      expect(read(file).includes("Passeio Infante"), `${file} hardcodes the street address`).toBe(false);
    }
  });

  it("locale files only claim the registry project count and years", () => {
    for (const locale of ["pt.json", "en.json", "es.json"]) {
      const content = read(`src/i18n/locales/${locale}`);
      for (const claim of projectClaims(content)) {
        expect(numericCore(claim), `${locale} project claim "${claim}"`).toBe(numericCore(PROJECT_COUNT));
      }
      for (const claim of yearsClaims(content)) {
        expect(claim, `${locale} years claim "${claim}"`).toBe(numericCore(YEARS));
      }
    }
  });

  it("the static shell and llms.txt only claim the registry project count", () => {
    for (const file of ["index.html", "public/llms.txt"]) {
      const content = read(file);
      for (const claim of projectClaims(content)) {
        expect(numericCore(claim), `${file} project claim "${claim}"`).toBe(numericCore(PROJECT_COUNT));
      }
    }
  });
});
