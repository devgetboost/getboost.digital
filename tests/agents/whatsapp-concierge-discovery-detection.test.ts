import { describe, it, expect } from "vitest";
import {
  detectDiscoveryCoverage,
  enforceDiscoveryGate,
} from "../../supabase/functions/_shared/conciergeChecks";

const a = (content: string) => ({ role: "assistant", content });
const u = (content: string) => ({ role: "user", content });

describe("Discovery detection — variações e ordem invertida", () => {
  it("detecta objectivo por variação de linguagem no assistente", () => {
    const cov = detectDiscoveryCoverage([a("Qual é o teu objectivo com isto?")]);
    expect(cov.topics).toContain("objetivo");
  });

  it("detecta prazo por resposta voluntária do utilizador (fora de ordem)", () => {
    const cov = detectDiscoveryCoverage([
      a("Olá! Como te posso ajudar?"),
      u("Preciso disto para o próximo mês"),
    ]);
    expect(cov.topics).toContain("prazo");
  });

  it("conta 2 tópicos quando utilizador voluntaria ambos numa mensagem", () => {
    const cov = detectDiscoveryCoverage([
      a("Olá, conta-me mais."),
      u("Quero aumentar leads e preciso disto até ao próximo trimestre"),
    ]);
    expect(cov.count).toBeGreaterThanOrEqual(2);
    expect(cov.topics).toEqual(expect.arrayContaining(["objetivo", "prazo"]));
  });

  it("não conta recolha de dados (email/telefone) como descoberta", () => {
    const cov = detectDiscoveryCoverage([
      a("Podes partilhar o teu email?"),
      u("teste@x.pt"),
      a("E o teu telefone +351?"),
      u("+351 912345678"),
    ]);
    expect(cov.assistantQuestions).toBe(0);
    expect(cov.count).toBe(0);
  });

  it("gate permite reunião quando utilizador voluntaria 2 tópicos sem serem perguntados", () => {
    const history = [
      a("Olá! Em que posso ajudar?"),
      u("Queremos gerar mais vendas o mais rápido possível"),
    ];
    const res = enforceDiscoveryGate(
      history,
      "Fixe 👌 Que tal marcarmos 15 min com o nosso Director Comercial?",
    );
    expect(res.overridden).toBe(false);
    expect(res.topics).toEqual(expect.arrayContaining(["objetivo", "prazo"]));
  });

  it("gate ainda bloqueia se só 1 tópico for coberto (mesmo fora de ordem)", () => {
    const history = [
      a("Boas 👋"),
      u("O meu objectivo é escalar convers[õo]es"),
    ];
    const res = enforceDiscoveryGate(history, "Agendamos reunião?");
    expect(res.overridden).toBe(true);
    expect(res.askedBefore).toBe(1);
  });

  it("2 perguntas genéricas do assistente contam mesmo sem match de tópico", () => {
    const history = [
      a("Conta-me lá tudo?"),
      u("ok"),
      a("E depois?"),
      u("mais coisas"),
    ];
    const res = enforceDiscoveryGate(history, "Marcamos reunião?");
    expect(res.overridden).toBe(false);
    expect(res.askedBefore).toBe(2);
  });
});
