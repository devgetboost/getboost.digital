import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const readIfExists = (rel: string): string | null => (existsSync(join(root, rel)) ? read(rel) : null);
const git = (...args: string[]): string => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
};

const ROBOTS = read("public/robots.txt");
const APP = read("src/App.tsx");
const AUDIT = readIfExists("reports/performance-audit.json");

/**
 * R21.1 — Production Release Readiness gates.
 *
 * Objective, checkable release hygiene. These assertions are about what the
 * repository must look like BEFORE a production deploy: no secret committed,
 * no internal surface indexable, no wave artifact missing, no generated
 * residue shipped. They stay in CI so the next release inherits the checks.
 */
describe("R21.1 — security posture (Fase 6)", () => {
  it("commits no service-role or private key material", () => {
    const tracked = git("ls-files").split("\n").filter(Boolean);
    // Only scan text-ish files; binaries (jpg/png) are skipped.
    const scannable = tracked.filter((file) => /\.(ts|tsx|js|mjs|json|md|txt|html|css|sql|toml|yml|yaml)$/.test(file));
    expect(scannable.length).toBeGreaterThan(100);
    const offenders = scannable.filter((file) => {
      let content = "";
      try {
        content = readIfExists(file) ?? "";
      } catch {
        return false;
      }
      return (
        /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content) ||
        /\b(sk_live|sk_test)_[A-Za-z0-9]{16,}/.test(content) ||
        /\beyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}/.test(content) ||
        /SERVICE_ROLE_KEY\s*=\s*["'][A-Za-z0-9._-]{20,}/.test(content)
      );
    });
    expect(offenders, `secret material in: ${offenders.join(", ")}`).toEqual([]);
  });

  it("keeps .env untracked and gitignored (B9)", () => {
    expect(git("ls-files", ".env")).toBe("");
    expect(git("check-ignore", "-v", ".env")).toContain(".env");
    // The variable-name contract stays committed.
    expect(git("ls-files", ".env.example")).toBe(".env.example");
    const example = read(".env.example");
    for (const key of ["VITE_ENV", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
      expect(example, key).toContain(key);
    }
  });

  it("keeps a local .env pointing nowhere near production", () => {
    // The file is untracked and absent on CI, so this only asserts when the
    // developer copy exists locally.
    if (!existsSync(join(root, ".env"))) return;
    const env = read(".env");
    expect(env).toContain('VITE_ENV="local"');
    // The production project ref must never appear in a local env file.
    expect(env).not.toContain("zwrrkbedbprgqtypglwm");
    // Only publishable (client-safe) keys, never a secret key.
    expect(env).toContain("sb_publishable_");
    expect(env).not.toContain("sb_secret_");
  });

  it("keeps Supabase CLI state out of version control", () => {
    const ignored = git("check-ignore", "-v", "supabase/.temp/project-ref");
    expect(ignored).toContain("supabase/.temp/");
    expect(git("ls-files", "supabase/.temp")).toBe("");
  });

  it("ships no debug-only logging in the intelligence modules", () => {
    const modules = [
      "src/lib/dashboard-data.ts",
      "src/lib/product-intelligence.ts",
      "src/lib/crm-qualification.ts",
      "src/lib/sales-intelligence.ts",
      "src/lib/performance.ts",
      "src/lib/case-intelligence.ts",
      "src/lib/lead-signals.ts",
      "src/lib/lead-score.ts",
      "src/lib/product-waitlist.ts",
      "src/data/product-demand.ts",
      "src/data/sales-model.ts",
      "src/data/crm-contract.ts",
    ];
    for (const module of modules) {
      expect(read(module), module).not.toMatch(/console\.(log|debug|info)\(/);
    }
  });
});

describe("R21.1 — internal surfaces stay internal (Fases 3, 15)", () => {
  it("disallows every guarded route in robots.txt", () => {
    for (const route of ["/admin/", "/cliente/", "/colaborador", "/dashboard", "/login", "/reset-password", "/unsubscribe"]) {
      expect(ROBOTS, `robots.txt disallows ${route}`).toContain(`Disallow: ${route}`);
    }
  });

  it("keeps internal routes out of every public artefact", () => {
    const artefacts = [
      "public/sitemap.xml",
      "public/sitemap-pages.xml",
      "public/sitemap-services.xml",
      "public/sitemap-blog.xml",
      "public/sitemap-resources.xml",
      "public/sitemap-demo.xml",
      "public/sitemap-portfolio.xml",
      "public/llms.txt",
    ].filter((file) => existsSync(join(root, file)));
    expect(artefacts.length).toBeGreaterThan(5);
    for (const file of artefacts) {
      expect(read(file), file).not.toContain("/dashboard");
      expect(read(file), file).not.toContain("/colaborador");
    }
  });

  it("keeps the dashboard authenticated and out of the public menu", () => {
    expect(APP).toContain('<Route path="/dashboard" element={<Dashboard />} />');
    expect(read("src/pages/Dashboard.tsx")).toContain("<RequireRoles anyOf={['admin', 'collaborator']}>");
    for (const surface of ["src/components/Header.tsx", "src/components/Footer.tsx"]) {
      expect(read(surface), surface).not.toContain("/dashboard");
    }
  });

  it("never re-adds the retired /about surface", () => {
    expect(readIfExists("src/pages/About.tsx")).toBeNull();
    const sitemaps = existsSync(join(root, "public/sitemap-pages.xml")) ? read("public/sitemap-pages.xml") : "";
    expect(sitemaps).not.toContain("/about");
  });
});

describe("R21.1 — wave consolidation (Fase 2)", () => {
  it("every R20.6–R20.12 wave artefact is present", () => {
    const artefacts = [
      // R20.6 — landing network
      "src/data/landings.ts",
      "src/pages/LandingPage.tsx",
      "src/tests/seo-landings.test.ts",
      // R20.7 — case studies
      "src/data/case-framework.ts",
      "src/lib/case-intelligence.ts",
      "src/tests/case-studies-premium.test.ts",
      // R20.8 — product demand
      "src/data/product-demand.ts",
      "src/lib/product-intelligence.ts",
      "src/lib/product-waitlist.ts",
      "src/lib/product-demand-report.ts",
      "src/tests/product-demand.test.ts",
      // R20.9 — CRM qualification
      "src/data/crm-contract.ts",
      "src/lib/lead-signals.ts",
      "src/lib/lead-score.ts",
      "src/lib/crm-qualification.ts",
      "src/tests/crm-qualification.test.ts",
      // R20.10 — sales layer
      "src/data/sales-model.ts",
      "src/lib/sales-actions.ts",
      "src/lib/sales-intelligence.ts",
      "src/tests/ai-sales-layer.test.ts",
      // R20.11 — performance
      "scripts/audit-critical-path.mjs",
      "src/lib/performance.ts",
      "src/tests/performance.test.ts",
      // R20.12 — dashboard
      "src/lib/dashboard-data.ts",
      "src/pages/Dashboard.tsx",
      "src/tests/revenue-dashboard.test.ts",
    ];
    const missing = artefacts.filter((file) => !existsSync(join(root, file)));
    expect(missing, `missing wave artefacts: ${missing.join(", ")}`).toEqual([]);
  });

  it("every wave ships its documentation", () => {
    const docs = [
      "docs/seo-landing-expansion.md",
      "docs/case-studies-premium.md",
      "docs/product-demand-generation.md",
      "docs/crm-qualification.md",
      "docs/ai-sales-layer.md",
      "docs/performance-optimization.md",
      "docs/revenue-dashboard.md",
    ];
    for (const doc of docs) {
      expect(existsSync(join(root, doc)), doc).toBe(true);
      expect(read(doc).length, doc).toBeGreaterThan(500);
    }
  });
});

describe("R21.1 — build artefacts (Fases 3, 4, 16)", () => {
  it("the sitemap generator is wired into the build", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts.build).toContain("generate-sitemap.js");
    // The suite runs as `npm run test` inside the build chain.
    expect(pkg.scripts.build).toContain("npm run test");
    expect(pkg.scripts.test).toContain("vitest run");
    expect(pkg.scripts.build).toContain("vite build");
  });

  it("sitemaps stay in sync with the landing network", () => {
    if (!existsSync(join(root, "public/sitemap-pages.xml"))) return;
    const sitemap = read("public/sitemap-pages.xml");
    for (const slug of ["ai-agentes-imobiliario", "automacao-whatsapp", "growth-system", "geracao-leads"]) {
      expect(sitemap, slug).toContain(`/${slug}`);
    }
    const landings = read("src/data/landings.ts");
    const slugs = [...landings.matchAll(/^\s{2}slug: '([a-z-]+)',$/gm)].map((m) => m[1]);
    for (const slug of slugs) expect(sitemap, `sitemap missing ${slug}`).toContain(`/${slug}`);
  });

  it("the committed performance baseline stays inside budget", () => {
    if (!AUDIT) return;
    const report = JSON.parse(AUDIT) as {
      rollup: { entryJsBytes: number; entryCssBytes?: number };
      shipped?: { criticalChunks?: Array<{ chunk: string }> };
    };
    expect(report.rollup.entryJsBytes).toBeLessThanOrEqual(600 * 1024);
    const critical = (report.shipped?.criticalChunks ?? []).map((row) => row.chunk);
    // Nothing internal may leak into the visitor critical path.
    expect(critical.some((chunk) => chunk.startsWith("Dashboard-"))).toBe(false);
    expect(critical.some((chunk) => chunk.startsWith("Admin"))).toBe(false);
  });

  it("no generated or temporary residue is staged for commit", () => {
    const changed = git("status", "--porcelain")
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
    const residue = changed.filter((file) =>
      // __tests__ is a conventional test directory (not residue); every other
      // double-underscore leaf (__probe, __snapshots_tmp, …) is still flagged.
      /(^|\/)(tmp|temp|probe|scratch|debug|__(?!tests__)[^/]*)\b|\.bak$|\.orig$|~$|(^|\/)\.DS_Store$|\.log$/i.test(file),
    );
    expect(residue, `residue: ${residue.join(", ")}`).toEqual([]);
  });

  it("dist and node_modules stay out of the commit", () => {
    expect(git("check-ignore", "-v", "dist").length > 0).toBe(true);
    expect(git("ls-files", "dist")).toBe("");
    expect(git("ls-files", "node_modules")).toBe("");
  });
});
