import { describe, it, expect } from "vitest";
import {
  enforceDiscoveryGate,
  countAssistantDiscoveryQuestions,
} from "../../supabase/functions/_shared/conciergeChecks";

const q = (content: string) => ({ role: "assistant", content });
const u = (content: string) => ({ role: "user", content });

describe("Discovery gate — só agenda depois de 2 perguntas", () => {
  it("bloqueia convite de reunião com 0 perguntas prévias", () => {
    const history = [u("Quero uma proposta")];
    const res = enforceDiscoveryGate(history, "Marcamos 15 min com o Director Comercial?");
    expect(res.overridden).toBe(true);
    expect(res.askedBefore).toBe(0);
    expect(res.reply).toMatch(/\?/);
  });

  it("bloqueia convite com apenas 1 pergunta prévia", () => {
    const history = [
      q("O que queres alcançar com isto?"),
      u("Aumentar leads"),
    ];
    const res = enforceDiscoveryGate(history, "Vamos agendar uma reunião?");
    expect(res.overridden).toBe(true);
    expect(res.askedBefore).toBe(1);
  });

  it("permite convite depois de 2 perguntas de descoberta", () => {
    const history = [
      q("O que queres alcançar com isto?"),
      u("Mais vendas"),
      q("E pra quando gostavas?"),
      u("Q1"),
    ];
    const res = enforceDiscoveryGate(
      history,
      "Fixe 👌 Que tal marcarmos 15 min com o nosso Director Comercial?",
    );
    expect(res.overridden).toBe(false);
    expect(res.askedBefore).toBe(2);
  });

  it("não conta convite de reunião como pergunta de descoberta", () => {
    const history = [
      q("O que queres alcançar?"),
      u("x"),
      q("Marcamos reunião? Que dia te dá jeito?"),
      u("segunda"),
    ];
    expect(countAssistantDiscoveryQuestions(history)).toBe(1);
  });

  it("resposta rápida do utilizador não muda a contagem", () => {
    // utilizador responde curto: assistente ainda só fez 1 pergunta
    const history = [q("O que queres alcançar?"), u("ok")];
    const res = enforceDiscoveryGate(history, "Podemos agendar?");
    expect(res.overridden).toBe(true);
  });
});
