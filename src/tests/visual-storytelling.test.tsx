import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { render, screen } from "@testing-library/react";
import { MiniFlow } from "../components/ui/mini-flow";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R18.9 — visual storytelling guards.
 * Diagrams are data-driven, decorative connectors are hidden from AT,
 * node labels stay readable, and no storytelling change adds routes,
 * links, copy blocks or tracking.
 */
describe("R18.9 — visual storytelling", () => {
  it("MiniFlow renders nodes as readable text with hidden connectors", () => {
    render(<MiniFlow steps={["Visitante", "AI Agent", "Venda"]} tint="#fff" strong="#000" />);
    expect(screen.getByText("Visitante")).toBeInTheDocument();
    expect(screen.getByText("AI Agent")).toBeInTheDocument();
    const { container } = render(<MiniFlow steps={["A", "B"]} tint="#fff" strong="#000" />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
  });

  it("MiniFlow renders status badges when provided", () => {
    render(<MiniFlow steps={["A", "B"]} tint="#fff" strong="#000" badges={["Online", "24/7"]} />);
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("24/7")).toBeInTheDocument();
  });

  it("every pillar carries a visual flow (AI additionally badges)", () => {
    const index = read("src/pages/Index.tsx");
    for (const flow of [
      "flow: ['Visitante', 'AI Agent', 'Qualificação', 'Reunião', 'Venda']",
      "flow: ['WhatsApp', 'CRM', 'ERP', 'Relatórios', 'Gestão']",
      "flow: ['Ideia', 'MVP', 'Produção', 'Escala']",
      "flow: ['SEO · Ads', 'Landing Pages', 'Pipeline', 'Leads', 'Clientes']",
    ]) {
      expect(index, flow).toContain(flow);
    }
    expect(index).toContain("badges: ['Online', '24/7', 'Resposta instantânea']");
    expect(index).toContain("<MiniFlow");
  });

  it("cases tell action → implementation → result above the metric", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain("flow: ['SEO', 'Arquitetura técnica + Conteúdo']");
    expect(index).toContain("flow: ['Automação', 'Eliminação de tarefas repetitivas']");
    expect(index).toContain("flow: ['IA', 'Qualificação 24/7']");
  });

  it("the method section has a premium timeline rail (desktop, decorative)", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain("timeline rail");
    expect(index).toContain("hidden lg:block");
  });

  it("flow connectors animate with a reduced-motion kill switch", () => {
    const css = read("src/styles/design-system.css");
    expect(css).toContain(".gb-flow-connector");
    expect(css).toContain("@keyframes gb-flow-dash-x");
    expect(css).toContain("@keyframes gb-flow-dash-y");
    expect(css).toMatch(/prefers-reduced-motion[^}]*\.gb-flow-connector[^}]*animation:\s*none/s);
  });
});
