import { test, expect, describe, beforeAll, afterAll } from "vitest";

// This is a unit-level test for the normalization logic and static SEO data integrity
// Integration UI testing with Playwright requires separate runner setup.
import { normalizePath } from "../lib/utils";
import { investorProjects } from "../data/investorProjects";

describe("Shared SEO and Routing Normalization", () => {
  test("normalizePath correctly cleans various URL formats", () => {
    // R1C7: /en is the INTL *market*, not a spelling of the bare PT path, so the
    // prefix survives normalization.
    expect(normalizePath("/EN/SERVICES/")).toBe("/en/services");
    expect(normalizePath("/investidores/Hostify/")).toBe("/investidores/hostify");
    // `/pt` is redundant: PT owns the bare path, so it collapses.
    expect(normalizePath("/pt/about")).toBe("/about");
    expect(normalizePath("/br/about")).toBe("/br/about");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("")).toBe("/");
  });
});

describe("Critical Pages Accessibility and Metadata Integrity", () => {
  test("All investor projects have necessary accessibility fields", () => {
    investorProjects.forEach(project => {
      expect(project.name, "Project must have a name").toBeTruthy();
      expect(project.tagline, "Project must have a descriptive tagline").toBeTruthy();
      expect(project.description.length, "Project must have a detailed description").toBeGreaterThan(0);
      expect(project.icon, "Project must have an accessible icon reference").toBeDefined();
    });
  });
});

