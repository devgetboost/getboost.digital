import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../components/ui/section-header";
import { Button } from "../components/ui/button";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 3A — design system guards.
 *
 * The frozen token layer from GETBOOST_2027_DESIGN_FREEZE_V1. CI fails on
 * token removal, value drift, missing scales/classes/variants, or a broken
 * SectionHeader export.
 */

const CSS = read("src/styles/design-system.css");
const CONFIG = read("tailwind.config.ts");
const BUTTON_SRC = read("src/components/ui/button.tsx");

/** Every frozen facet: token name → hex value (case-insensitive). */
const FROZEN_TOKENS: Record<string, string> = {
  "--gb-brand-50": "#fff2ed",
  "--gb-brand-100": "#ffe0d4",
  "--gb-brand-200": "#ffc2a9",
  "--gb-brand-300": "#ff9c78",
  "--gb-brand-400": "#ff7647",
  "--gb-brand-500": "#ff4000",
  "--gb-brand-600": "#d33600",
  "--gb-brand-700": "#b72f00",
  "--gb-sand-0": "#faf7f1",
  "--gb-sand-50": "#f4efe5",
  "--gb-sand-100": "#eae3d3",
  "--gb-sand-200": "#ddd2bd",
  "--gb-sand-300": "#c6b89e",
  "--gb-sand-400": "#a2947a",
  "--gb-sand-500": "#776c57",
  "--gb-sand-600": "#575046",
  "--gb-sand-700": "#403a32",
  "--gb-sand-800": "#292520",
  "--gb-sand-900": "#1b1814",
  "--gb-sand-950": "#12100d",
  "--gb-canvas-base": "#faf7f1",
  "--gb-canvas-subtle": "#f4efe5",
  "--gb-canvas-section": "#eae3d3",
  "--gb-canvas-tint": "#fff2ed",
  "--gb-canvas-inverse": "#14110d",
  "--gb-ink-primary": "#171310",
  "--gb-ink-secondary": "#575046",
  "--gb-ink-tertiary": "#a2947a",
  "--gb-ink-inverse": "#f4efe5",
  "--gb-ink-on-brand": "#faf7f1",
  "--gb-success": "#15803d",
  "--gb-success-bg": "#f0fdf4",
  "--gb-success-border": "#bbf7d0",
  "--gb-warning": "#b45309",
  "--gb-warning-bg": "#fffbeb",
  "--gb-warning-border": "#fde68a",
  "--gb-error": "#b91c1c",
  "--gb-error-bg": "#fef2f2",
  "--gb-error-border": "#fecaca",
  // pillars — unique hue per pillar, matched depth
  "--gb-ai-base": "#7c3aed",
  "--gb-ai-strong": "#6d28d9",
  "--gb-ai-tint": "#f5f3ff",
  "--gb-ai-border": "#ddd6fe",
  "--gb-automation-base": "#0d9488",
  "--gb-automation-strong": "#0f766e",
  "--gb-automation-tint": "#f0fdfa",
  "--gb-automation-border": "#ccfbf1",
  "--gb-software-base": "#2563eb",
  "--gb-software-strong": "#1d4ed8",
  "--gb-software-tint": "#eff6ff",
  "--gb-software-border": "#dbeafe",
  "--gb-growth-base": "#16a34a",
  "--gb-growth-strong": "#15803d",
  "--gb-growth-tint": "#f0fdf4",
  "--gb-growth-border": "#dcfce7",
};

const SPACING_TOKENS: Record<string, string> = {
  "--gb-space-1": "0.25rem",
  "--gb-space-2": "0.5rem",
  "--gb-space-3": "0.75rem",
  "--gb-space-4": "1rem",
  "--gb-space-6": "1.5rem",
  "--gb-space-8": "2rem",
  "--gb-space-10": "2.5rem",
  "--gb-space-12": "3rem",
  "--gb-space-16": "4rem",
  "--gb-space-20": "5rem",
  "--gb-space-24": "6rem",
  "--gb-space-32": "8rem",
};

const SURFACE_CLASSES = [
  ".gb-surface-page",
  ".gb-surface-section",
  ".gb-surface-subtle",
  ".gb-container",
  ".gb-section",
  ".gb-surface-card",
  ".gb-surface-card-elevated",
  ".gb-surface-pillar-card",
  ".gb-cta-band",
  ".gb-hairline",
  ".gb-hairline-accent",
  ".gb-grid-overlay",
];

const TYPE_CLASSES = [
  ".gb-text-display",
  ".gb-text-h1",
  ".gb-text-h2",
  ".gb-text-h3",
  ".gb-text-body",
  ".gb-text-small",
  ".gb-eyebrow",
];

describe("Wave 3A — design system foundation", () => {
  it("the token stylesheet ships and is linked before first paint", () => {
    expect(CSS).toContain(":root");
    // R20.11 — global CSS moved from main.tsx to index.html so the browser's
    // preload scanner finds it without waiting for the bundle to execute. The
    // guard follows the stylesheet: it must ship, and it must be linked from
    // HTML with the token layer AFTER the base layer (cascade order).
    const HTML = read("index.html");
    expect(HTML).toContain('<link rel="stylesheet" href="/src/index.css" />');
    const designAt = HTML.indexOf('/src/styles/design-system.css');
    const baseAt = HTML.indexOf('/src/index.css');
    expect(designAt).toBeGreaterThan(-1);
    expect(designAt).toBeGreaterThan(baseAt);
    expect(read("src/main.tsx")).not.toContain("design-system.css");
  });

  it("every frozen colour token exists with its frozen value", () => {
    for (const [token, value] of Object.entries(FROZEN_TOKENS)) {
      const match = CSS.match(new RegExp(`${token}:\\s*(${value})\\s*;`, "i"));
      expect(match, `${token} must be ${value}`).not.toBeNull();
    }
  });

  it("the orange brand constant is consistent across token layers", () => {
    // CSS token == freeze value == legacy --primary (hsl 14 100% 50% == #ff4000)
    expect(CSS).toContain("--gb-brand-500: #ff4000");
    expect(read("src/index.css")).toMatch(/--primary:\s*14 100% 50%/);
    // orange is never a pillar colour
    const pillarValues = Object.entries(FROZEN_TOKENS)
      .filter(([token]) => /ai|automation|software|growth/.test(token))
      .map(([, value]) => value);
    expect(pillarValues).not.toContain("#ff4000");
  });

  it("the 8pt spacing scale and section/container tokens exist", () => {
    for (const [token, value] of Object.entries(SPACING_TOKENS)) {
      expect(CSS, token).toContain(`${token}: ${value}`);
    }
    expect(CSS).toMatch(/\.gb-container\s*\{[^}]*max-width:\s*1280px/);
    // R18.8: the card radius follows the built standard (rounded-2xl = 1rem).
    expect(CSS).toMatch(/--gb-radius-card:\s*1rem/);
  });

  it("all surface patterns and type utilities exist", () => {
    for (const cls of SURFACE_CLASSES) expect(CSS, cls).toContain(cls);
    for (const cls of TYPE_CLASSES) expect(CSS, cls).toContain(cls);
    // pillar card reads its accent from --gb-pillar
    expect(CSS).toMatch(/gb-surface-pillar-card[^}]*var\(--gb-pillar/);
    // grid overlay stays subtle (≤6%)
    expect(CSS).toMatch(/\.gb-grid-overlay\s*\{[^}]*opacity:\s*0\.0[0-9]/);
  });

  it("the R18.8 unification primitives exist (card, chip, icon, shadows)", () => {
    for (const cls of [".gb-card", ".gb-chip", ".gb-icon-chip", ".gb-surface-feature", ".gb-gradient-brand"]) {
      expect(CSS, cls).toContain(cls);
    }
    for (const token of ["--gb-shadow-sm", "--gb-shadow-md", "--gb-shadow-lg", "--gb-shadow-premium", "--gb-line"]) {
      expect(CSS, token).toContain(token);
    }
    const config = read("tailwind.config.ts");
    for (const scale of ["sm", "md", "lg", "premium"]) {
      expect(config, `tailwind shadow scale: ${scale}`).toMatch(new RegExp(`${scale}:\\s*"var\\(--gb-shadow`));
    }
  });

  it("the Tailwind config mirrors every scale", () => {
    for (const scale of ["brand", "sand", "canvas", "ink", "ai", "automation", "software", "growth"]) {
      expect(CONFIG, `tailwind scale: ${scale}`).toMatch(new RegExp(`${scale}:\\s*\\{`));
    }
    for (const status of ["success", "warning", "error"]) {
      expect(CONFIG, `tailwind status: ${status}`).toContain(status);
    }
    for (const size of ["display", "h1", "h2", "h3", "body", "small"]) {
      expect(CONFIG, `tailwind fontSize: ${size}`).toMatch(new RegExp(`${size}:\\s*\\[`));
    }
  });

  it("the button system exposes the frozen variants and states", () => {
    for (const variant of ["default", "outline", "ghost"]) {
      expect(BUTTON_SRC, `button variant ${variant}`).toContain(variant);
    }
    // focus, disabled, loading states
    expect(BUTTON_SRC).toContain("focus-visible:ring-2");
    expect(BUTTON_SRC).toContain("disabled:opacity-50");
    expect(BUTTON_SRC).toContain("loading");
    expect(BUTTON_SRC).toContain("aria-busy");
  });

  it("the button renders a busy, non-interactive loading state", () => {
    render(
      <Button loading disabled>
        Enviar
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.textContent).toContain("Enviar"); // label stays for AT
  });

  it("the SectionHeader renders every slot and both alignments", () => {
    const { rerender } = render(
      <SectionHeader
        eyebrow="O que fazemos"
        title="5 alavancas"
        description="Cada peça funciona sozinha."
        proof="30+ projectos entregues"
      />,
    );
    expect(screen.getByText("O que fazemos")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("5 alavancas");
    expect(screen.getByText("Cada peça funciona sozinha.")).toBeInTheDocument();
    expect(screen.getByText("30+ projectos entregues")).toBeInTheDocument();

    // eyebrow uses the brand token, heading the frozen h2 class
    expect(screen.getByText("O que fazemos").className).toContain("gb-eyebrow");

    rerender(<SectionHeader eyebrow="x" title="centro" align="center" />);
    expect(screen.getByText("centro").parentElement?.className).toContain("text-center");
  });

  it("the SectionHeader supports heading-level control", () => {
    render(<SectionHeader title="Nível três" as="h3" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Nível três");
  });
});
