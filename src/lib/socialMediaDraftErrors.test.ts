import { describe, it, expect } from "vitest";
import { isPastScheduleError, translateDraftError } from "./socialMediaDraftErrors";

describe("isPastScheduleError", () => {
  it("detects Postgres SQLSTATE 22007 as a past-schedule error", () => {
    expect(isPastScheduleError({ code: "22007", message: "scheduled_at tem de ser no futuro" })).toBe(true);
  });

  it("detects by message when the code is missing (older PostgREST versions)", () => {
    expect(isPastScheduleError({ code: null, message: "scheduled_at must be in the future" })).toBe(true);
  });

  it("does NOT flag unrelated errors", () => {
    expect(isPastScheduleError({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isPastScheduleError({ code: "42501", message: "permission denied" })).toBe(false);
  });

  it("handles null/undefined safely", () => {
    expect(isPastScheduleError(null)).toBe(false);
    expect(isPastScheduleError(undefined)).toBe(false);
    expect(isPastScheduleError({})).toBe(false);
  });
});

describe("translateDraftError", () => {
  it("returns a friendly 'agendar' message for SQLSTATE 22007 when scheduling", () => {
    const msg = translateDraftError(
      { code: "22007", message: "scheduled_at tem de ser no futuro (recebido ...)" },
      "scheduled",
    );
    expect(msg).toBe("Não foi possível agendar: a data escolhida está no passado. Escolhe uma data/hora futura.");
  });

  it("uses 'atualizar' verb when the intent is not scheduling", () => {
    const msg = translateDraftError({ code: "22007", message: "scheduled_at ..." }, "approved");
    expect(msg).toBe("Não foi possível atualizar: a data escolhida está no passado. Escolhe uma data/hora futura.");
  });

  it("falls back to the raw message for unrelated errors", () => {
    const msg = translateDraftError({ code: "23505", message: "duplicate key value" }, "scheduled");
    expect(msg).toBe("duplicate key value");
  });

  it("returns empty string when there is no error", () => {
    expect(translateDraftError(null, "scheduled")).toBe("");
  });
});

// Nota: a validação server-side propriamente dita (trigger BEFORE INSERT OR
// UPDATE em public.social_media_drafts) foi verificada via psql durante a
// implementação — um INSERT com `scheduled_at = now() - 1h` falha com:
//   ERROR: scheduled_at tem de ser no futuro (...)  SQLSTATE 22007
// Este ficheiro cobre o contrato UI ↔ código de erro que essa trigger emite.
