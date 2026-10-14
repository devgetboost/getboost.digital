import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../components/ui/section-header";
import {
  Display,
  EditorialKicker,
  FilmStrip,
  Marquee,
  ProcessList,
  StatRow,
} from "../components/editorial";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

// jsdom has no IntersectionObserver — same stub as motion-system.test.tsx.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })),
  );
});

/**
 * R22 — editorial language guards.
 *
 * Novair-inspired dynamics on Getboost tokens: the paper canvas stays warm,
 * the brand constant is untouched, and every editorial primitive renders
 * its structural contract (kicker, display + serif accent, stats, numbered
 * process, film frames, marquee).
 */

const CSS = read("src/styles/design-system.css");

describe("R22 — editorial language", () => {
  it("the paper canvas is warm and the brand constant is untouched", () => {
    expect(CSS).toContain("--gb-canvas-base: #faf7f1");
    expect(CSS).toContain("--gb-brand-500: #ff4000");
    expect(CSS).toContain("--gb-ink-primary: #171310");
  });

  it("the display serif is loaded and wired", () => {
    expect(read("src/index.css")).toContain("Instrument+Serif");
    expect(read("tailwind.config.ts")).toMatch(/fontFamily:\s*\{/);
    expect(read("tailwind.config.ts")).toContain("Instrument Serif");
    expect(CSS).toContain(".ed-display");
    expect(CSS).toContain(".ed-display em");
  });

  it("the SectionHeader speaks editorial without changing its API", () => {
    render(<SectionHeader eyebrow="O que fazemos" title="5 alavancas" />);
    expect(screen.getByText("O que fazemos").closest(".ed-kicker")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2 }).className).toContain("ed-display");
  });

  it("the kicker carries its number", () => {
    render(<EditorialKicker index="01" label="Porquê nós" />);
    expect(screen.getByText("(01)")).toBeInTheDocument();
  });

  it("display headlines render serif accents via em", () => {
    render(
      <Display>
        Automação que gera <em>crescimento</em>.
      </Display>,
    );
    expect(screen.getByText("crescimento").tagName).toBe("EM");
  });

  it("stat rows render every figure", () => {
    render(<StatRow stats={[{ value: "+312%", label: "MQLs" }]} />);
    expect(screen.getByText("+312%")).toBeInTheDocument();
  });

  it("process lists number every step", () => {
    render(<ProcessList steps={[{ title: "Descoberta", desc: "Ouvimos primeiro." }]} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("film strips number every frame", () => {
    render(
      <FilmStrip
        frames={[{ src: "/x.jpg", alt: "Caso", caption: "Qook" }]}
      />,
    );
    expect(screen.getByText("Fr 001")).toBeInTheDocument();
  });

  it("marquees repeat their items for a seamless loop", () => {
    render(<Marquee items={["Automação", "Growth"]} />);
    expect(screen.getAllByText("Automação").length).toBeGreaterThan(1);
  });
});
