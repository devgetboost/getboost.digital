import { expect, test, describe } from "vitest";
import { investorProjects } from "../data/investorProjects";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("SEO Critical Validation", () => {
  test("Investor slugs must be unique (Critical)", () => {
    const slugs = investorProjects.map(p => p.slug);
    const duplicates = slugs.filter((item, index) => slugs.indexOf(item) !== index);
    expect(duplicates, `Duplicate slugs found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test("Sitemap and Robots integrity (Critical)", () => {
    const sitemapPath = join(process.cwd(), "public/sitemap.xml");
    const robotsPath = join(process.cwd(), "public/robots.txt");

    expect(existsSync(sitemapPath), "sitemap.xml missing in public/").toBe(true);
    expect(existsSync(robotsPath), "robots.txt missing in public/").toBe(true);

    const sitemapContent = readFileSync(sitemapPath, "utf-8");
    const robotsContent = readFileSync(robotsPath, "utf-8");

    expect(sitemapContent).toContain("https://getboostsoft.lovable.app");
    expect(sitemapContent).toContain("<sitemapindex");
    expect(robotsContent).toContain("Sitemap:");
    expect(robotsContent).toContain("User-agent: *");
  });

  test("Sitemap includes alternate links with proper xhtml namespace (Multilingual)", () => {
    const sitemapPagesPath = join(process.cwd(), "public/sitemap-pages.xml");
    expect(existsSync(sitemapPagesPath), "sitemap-pages.xml missing").toBe(true);
    
    const content = readFileSync(sitemapPagesPath, "utf-8");
    expect(content).toContain("xmlns:xhtml=\"http://www.w3.org/1999/xhtml\"");
    expect(content).toContain("hreflang=\"en\"");
    expect(content).toContain("hreflang=\"es\"");
    expect(content).toContain("hreflang=\"pt\"");
    expect(content).toContain("hreflang=\"x-default\"");
  });

  test("No orphan paths (404 and Robots)", () => {
    const robotsContent = readFileSync(join(process.cwd(), "public/robots.txt"), "utf-8");
    expect(robotsContent).not.toContain("Disallow: / "); // Should not block everything
    expect(robotsContent).toContain("Allow: /");
  });
});
