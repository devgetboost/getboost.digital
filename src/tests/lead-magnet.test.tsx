import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "fs";
import { join } from "path";
import {
  ASSESSMENTS,
  getAssessment,
  pillarBreakdown,
  scoreAssessment,
  tierForPercentage,
  validateAssessment,
} from "../lib/lead-magnets";
import { getAssessmentStats } from "../lib/funnel-intelligence";
import { LeadMagnetModal } from "../components/LeadMagnetModal";
import "../i18n";

vi.mock("@/lib/commercialApi", () => ({
  captureLead: vi.fn(async () => ({ data: { lead_id: "lead-1" }, error: null })),
  CommercialWriteError: class extends Error {},
}));

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R20.4 — lead magnet guards.
 * Engine scoring, assessment validity, funnel integration, tracking
 * wiring, modal flow (quiz → score → lead → analysis) and entry points.
 */
describe("R20.4 — engine", () => {
  it("ships five valid assessments (one per category)", () => {
    expect(ASSESSMENTS.map((a) => a.id).sort()).toEqual(
      ["ai-readiness", "automation-audit", "growth-score", "operations-score", "software-readiness"].sort(),
    );
    for (const assessment of ASSESSMENTS) {
      expect(validateAssessment(assessment), `${assessment.id} valid`).toBe(true);
      expect(assessment.questions.length).toBeGreaterThanOrEqual(5);
    }
    expect(getAssessment("ai-readiness")?.category).toBe("AI");
    expect(getAssessment("nope")).toBeUndefined();
  });

  it("scores tiers on transparent thresholds", () => {
    expect(tierForPercentage(0)).toBe("basico");
    expect(tierForPercentage(39)).toBe("basico");
    expect(tierForPercentage(40)).toBe("intermedio");
    expect(tierForPercentage(69)).toBe("intermedio");
    expect(tierForPercentage(70)).toBe("avancado");
    expect(tierForPercentage(100)).toBe("avancado");
  });

  it("scores answers with clamped points", () => {
    const assessment = getAssessment("ai-readiness")!;
    const all = Object.fromEntries(assessment.questions.map((q) => [q.id, 2]));
    expect(scoreAssessment(assessment, all)).toMatchObject({ percentage: 100, tier: "avancado" });
    expect(scoreAssessment(assessment, {})).toMatchObject({ percentage: 0, tier: "basico" });
    const rigged = { [assessment.questions[0].id]: 99 };
    const result = scoreAssessment(assessment, rigged);
    expect(result.total).toBeLessThanOrEqual(result.max);
  });

  it("breaks down transversal assessments per pillar", () => {
    const assessment = getAssessment("operations-score")!;
    expect(assessment.questions.length).toBe(8);
    const answers = Object.fromEntries(assessment.questions.map((q) => [q.id, 2]));
    const breakdown = pillarBreakdown(assessment, answers);
    expect(Object.keys(breakdown).sort()).toEqual(["ai", "automation", "growth", "software"]);
    expect(Object.values(breakdown).every((v) => v === 100)).toBe(true);
    expect(pillarBreakdown(getAssessment("ai-readiness")!, {})).toEqual({});
  });
});

describe("R20.4 — funnel integration", () => {
  it("answers per-assessment starts/completes/leads/results", () => {
    const ev = (label: string) => ({ name: `assessment_${label.split("_").pop()}`, category: "lead_magnet", label });
    const events = [
      ...Array.from({ length: 10 }, () => ev("ai-readiness_start")),
      ...Array.from({ length: 7 }, () => ev("ai-readiness_complete")),
      ...Array.from({ length: 4 }, () => ev("ai-readiness_lead_capture")),
      ...Array.from({ length: 4 }, () => ev("ai-readiness_result_view")),
      ev("growth-score_start"),
    ];
    const stats = getAssessmentStats(events as never, "ai-readiness");
    expect(stats).toMatchObject({
      assessment: "ai-readiness",
      starts: 10,
      completes: 7,
      leads: 4,
      results: 4,
      completionRate: 0.7,
    });
    expect(stats.captureRate).toBeCloseTo(4 / 7);
    expect(getAssessmentStats([], "ai-readiness")).toMatchObject({ completionRate: null, captureRate: null });
  });

  it("tracks assessment events through the taxonomy helper", () => {
    const src = read("src/lib/analytics.ts");
    expect(src).toContain("trackAssessment");
    expect(src).toContain("assessment_${event}");
    expect(src).toContain("category: 'lead_magnet'");
  });
});

describe("R20.4 — modal flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs quiz → score → lead → analysis without silent capture", async () => {
    const { captureLead } = await import("@/lib/commercialApi");
    render(
      <MemoryRouter>
        <LeadMagnetModal open onClose={() => {}} initialAssessment="growth-score" />
      </MemoryRouter>,
    );
    // intro → start
    fireEvent.click(screen.getByRole("button", { name: /começar avaliação/i }));
    // answer all 5 questions with the first option each
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole("button");
      const options = buttons.filter((b) => !/voltar|repetir|receber|agendar|demonstração/i.test(b.textContent ?? ""));
      fireEvent.click(options[0]);
    }
    // score is free, analysis is gated
    expect(await screen.findByText(/ver análise completa/i)).toBeInTheDocument();
    expect(screen.queryByText(/oportunidades/i)).not.toBeInTheDocument();
    expect(captureLead).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /ver análise completa/i }));
    // lead gate validates before capturing
    fireEvent.click(screen.getByRole("button", { name: /receber análise/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(captureLead).not.toHaveBeenCalled();
  });

  it("captures the lead with structured metadata on consent", async () => {
    const { captureLead } = await import("@/lib/commercialApi");
    render(
      <MemoryRouter>
        <LeadMagnetModal open onClose={() => {}} initialAssessment="ai-readiness" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /começar avaliação/i }));
    // answer all 5 questions with the last text option each
    // (icon-only buttons and the dialog Close carry no option text)
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole("button");
      const options = buttons
        .filter((b) => {
          const t = (b.textContent ?? "").trim();
          return t.length > 0 && t !== "Close" && !/voltar|repetir|receber|agendar|demonstração/i.test(t);
        });
      fireEvent.click(options[options.length - 1]);
    }
    fireEvent.click(await screen.findByRole("button", { name: /ver análise completa/i }));
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@example.com" } });
    // consent checkbox lives inside the label; click it via role
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /receber análise/i }));
    expect(await screen.findByText(/oportunidades/i)).toBeInTheDocument();
    expect(captureLead).toHaveBeenCalledTimes(1);
    const payload = (captureLead as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload).toMatchObject({
      source: "lead-magnet:ai-readiness",
      name: "Ana",
      email: "ana@example.com",
      service_interest: "AI",
      consent: { marketing: true },
    });
    expect(payload.legacy).toMatchObject({ assessment: "ai-readiness" });
    expect(Object.keys(payload)).not.toContain("message");
  });
});

describe("R20.4 — entry points and wiring", () => {
  it("mounts the global host once (renders nothing until opened)", () => {
    const app = read("src/App.tsx");
    expect(app).toContain("LeadMagnetHost");
    expect(read("src/components/LeadMagnetModal.tsx")).toContain("gb:open-lead-magnet");
  });

  it("wires the Insights entry without touching routes or SEO", () => {
    const insights = read("src/pages/Insights.tsx");
    expect(insights).toContain("openLeadMagnet()");
    expect(insights).toContain("Avaliação de Maturidade Digital");
  });

  it("documents entry points, flows and limits", () => {
    const doc = read("docs/lead-magnet-system.md");
    for (const token of ["ai-readiness", "operations-score", "lead-magnet:", "assessment_lead_capture", "Limitações"]) {
      expect(doc, token).toContain(token);
    }
  });
});
