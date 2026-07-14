import { test, expect, describe, beforeAll, afterAll } from "vitest";

// This is a unit-level test for the normalization logic and static SEO data integrity
// Integration UI testing with Playwright requires separate runner setup.
import { normalizePath } from "../lib/utils";
import { investorProjects } from "../data/investorProjects";

describe("Shared SEO and Routing Normalization", () => {
  test("normalizePath correctly cleans various URL formats", () => {
    expect(normalizePath("/EN/SERVICES/")).toBe("/services");
    expect(normalizePath("/investidores/Hostify/")).toBe("/investidores/hostify");
    expect(normalizePath("/pt/about")).toBe("/about");
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

