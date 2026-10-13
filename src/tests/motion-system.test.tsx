import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "fs";
import { join } from "path";
import { CountUp } from "../components/ui/count-up";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R18.7 — global motion system guards.
 * Pins the reveal/stagger/hover/counter/parallax/reduced-motion contract
 * so future edits cannot silently regress the homepage motion quality.
 */

// jsdom has no IntersectionObserver — report every observed element as visible.
const observe = vi.fn();
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn((callback: IntersectionObserverCallback) => {
      (globalThis as unknown as { __ioCallback?: IntersectionObserverCallback }).__ioCallback = callback;
      return { observe, unobserve: vi.fn(), disconnect: vi.fn() };
    }),
  );
});

const fireVisible = () => {
  const callback = (globalThis as unknown as { __ioCallback?: IntersectionObserverCallback }).__ioCallback;
  callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
};

describe("R18.7 — motion system", () => {
  it("CountUp animates 0 → target once in view", async () => {
    render(<CountUp value="+300%" duration={0.05} />);
    fireVisible();
    expect(await screen.findByText("+300%", {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("CountUp preserves prefixes, suffixes and non-countable values", async () => {
    const { rerender } = render(<CountUp value="−70%" duration={0.05} />);
    fireVisible();
    expect(await screen.findByText("−70%", {}, { timeout: 2000 })).toBeInTheDocument();
    rerender(<CountUp value="24/7" />);
    expect(await screen.findByText("24/7")).toBeInTheDocument();
  });

  it("the card-lift, link-underline and glow utilities exist with spec values", () => {
    const css = read("src/styles/design-system.css");
    expect(css).toContain(".gb-card-lift");
    expect(css).toMatch(/\.gb-card-lift:hover\s*\{[^}]*translateY\(-6px\)[^}]*scale\(1\.02\)/);
    expect(css).toMatch(/\.gb-card-lift:hover\s*\{[^}]*250ms|0\.25s/);
    expect(css).toContain(".gb-link-more");
    expect(css).toContain("--gb-glow");
    for (const token of ["--gb-ai-glow", "--gb-automation-glow", "--gb-software-glow", "--gb-growth-glow"]) {
      expect(css, token).toContain(token);
    }
    expect(css).toMatch(/\.gb-surface-card-elevated:hover\s*\{[^}]*translateY\(-6px\)/);
  });

  it("buttons carry the press physics (hover lift, press reset, 200ms)", () => {
    const button = read("src/components/ui/button.tsx");
    expect(button).toContain("hover:-translate-y-[2px]");
    expect(button).toContain("active:translate-y-0");
    expect(button).toContain("duration-200");
  });

  it("reduced motion is honoured at the root and in the hero", () => {
    expect(read("src/main.tsx")).toContain('reducedMotion="user"');
    const index = read("src/pages/Index.tsx");
    // float loops, parallax transforms and drift are all gated
    expect(index).toContain("reduceMotion ? undefined");
    expect(index).toContain("reduceMotion ? 0");
  });

  it("the homepage wires counters, parallax and glow on the frozen sections", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain("<CountUp");
    expect(index).toContain("casesY");
    expect(index).toContain("ctaY");
    expect(index).toContain("gb-card-lift");
    expect(index).toContain("gb-link-more");
  });

  it("the footer blocks share the global reveal", () => {
    const footer = read("src/components/Footer.tsx");
    expect(footer).toContain("whileInView");
    expect(footer).toContain('viewport={{ once: true }}');
  });
});
