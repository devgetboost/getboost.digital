import { describe, it, expect } from "vitest";
import { analyzeConciergeReply } from "../../supabase/functions/_shared/conciergeChecks";

describe("WhatsApp Concierge — persona, perguntas, convite reunião", () => {
  it("respeita persona: rejeita frases robóticas proibidas", () => {
    const bad = analyzeConciergeReply("Vou preparar uma proposta detalhada e o Nuno irá rever.");
    expect(bad.personaOk).toBe(false);
    const good = analyzeConciergeReply("Deixa-me passar isto ao nosso Director Comercial pra elaborar uma proposta à medida.");
    expect(good.personaOk).toBe(true);
  });

  it("faz no máximo 1 pergunta por mensagem", () => {
    const ok = analyzeConciergeReply("Boa! Conta-me em duas linhas — o que queres alcançar com isto?");
    expect(ok.questionCount).toBe(1);
    expect(ok.singleQuestionOk).toBe(true);

    const bad = analyzeConciergeReply("Qual o objectivo? E pra quando? E tens budget?");
    expect(bad.questionCount).toBeGreaterThan(1);
    expect(bad.singleQuestionOk).toBe(false);
  });

  it("depois de descoberta, propõe reunião com Director Comercial", () => {
    const r = analyzeConciergeReply(
      "Fixe, já tenho o essencial 👌 Que tal marcarmos 15 min com o nosso Director Comercial pra desenharmos isto contigo?",
    );
    expect(r.hasMeetingInvite).toBe(true);
  });

  it("aceita link de booking como convite válido", () => {
    const r = analyzeConciergeReply("Podes escolher um horário aqui: https://getboost.digital/booking");
    expect(r.hasMeetingInvite).toBe(true);
  });

  it("mantém PT-PT (sem markers PT-BR)", () => {
    expect(analyzeConciergeReply("Tá tudo bem, e depois falamos.").ptPtOk).toBe(true);
    expect(analyzeConciergeReply("Você quer marcar hoje?").ptPtOk).toBe(false);
  });

  it("simulação de fluxo: 2 perguntas antes do convite", () => {
    const turns = [
      "Olá! Boa pergunta 👋 Conta-me em duas linhas — o que queres alcançar com isto?",
      "Fixe, faz todo o sentido. E pra quando é que gostavas de ter isto a andar?",
      "Perfeito 👌 Que tal marcarmos 15 min com o nosso Director Comercial pra desenharmos isto contigo?",
    ];
    const checks = turns.map(analyzeConciergeReply);
    // todas respeitam persona e uma pergunta por turno
    expect(checks.every((c) => c.personaOk && c.singleQuestionOk && c.ptPtOk)).toBe(true);
    // primeiras duas são perguntas de descoberta
    expect(checks[0].questionCount).toBe(1);
    expect(checks[1].questionCount).toBe(1);
    // terceira contém convite de reunião
    expect(checks[2].hasMeetingInvite).toBe(true);
  });
});
