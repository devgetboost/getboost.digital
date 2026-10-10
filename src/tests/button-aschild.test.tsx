import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { Button } from "../components/ui/button";

/**
 * Regression: Wave 3A's Button added a `{loading && <span/>}` spinner ahead
 * of `{children}`. With asChild, Slot receives `[false, child]` — Radix
 * SlotClone counts the boolean as a node (Children.count > 1) and throws
 * "React.Children.only expected to receive a single React element child",
 * white-screening every page that uses <Button asChild> (homepage + hubs).
 * These tests pin the Slot contract: asChild must receive exactly `children`.
 */
describe("Button asChild Slot contract", () => {
  it("renders a single-element child without throwing", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <Button asChild variant="outline">
            <Link to="/portfolio">Ver portefólio</Link>
          </Button>
        </MemoryRouter>,
      ),
    ).not.toThrow();
    expect(screen.getByRole("link", { name: /ver portefólio/i })).toHaveAttribute("href", "/portfolio");
  });

  it("does not throw for asChild + loading (spinner stays out of Slot)", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <Button asChild variant="ghost" loading>
            <Link to="/blog">Ver artigos</Link>
          </Button>
        </MemoryRouter>,
      ),
    ).not.toThrow();
    expect(screen.getByRole("link", { name: /ver artigos/i })).toBeInTheDocument();
  });
});
