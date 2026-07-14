import { z } from "zod";

// Validação partilhada entre a UI (AdminSocialMediaDrafts) e os testes.
// Regras: URL http(s), sem espaços, com host contendo ".", máx 2048 chars.
// Vazio ("") é permitido e significa "remover video_url do output".
export const videoUrlSchema = z
  .string()
  .trim()
  .max(2048, { message: "URL demasiado longo (máx 2048 caracteres)." })
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), {
    message: "URL inválido. Usa http:// ou https:// sem espaços.",
  })
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        const u = new URL(v);
        return (
          (u.protocol === "http:" || u.protocol === "https:") &&
          !!u.hostname &&
          u.hostname.includes(".")
        );
      } catch {
        return false;
      }
    },
    { message: "URL inválido: verifica o domínio e o protocolo." },
  );

export type VideoUrlValidation =
  | { ok: true; value: string; remove: boolean }
  | { ok: false; error: string };

export function validateVideoUrl(input: string): VideoUrlValidation {
  const parsed = videoUrlSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "URL inválido." };
  }
  return { ok: true, value: parsed.data, remove: parsed.data === "" };
}

// Aplica o resultado da validação sobre o `output` do draft. Devolve o novo
// objecto output pronto a persistir (com video_url definido ou removido).
export function applyVideoUrlToOutput(
  output: unknown,
  input: string,
): { ok: true; output: Record<string, unknown> } | { ok: false; error: string } {
  const v = validateVideoUrl(input);
  if (v.ok === false) return { ok: false, error: v.error };
  const base: Record<string, unknown> =
    output && typeof output === "object" && !Array.isArray(output)
      ? { ...(output as Record<string, unknown>) }
      : {};
  if (v.remove) {
    delete base.video_url;
  } else {
    base.video_url = v.value;
  }
  return { ok: true, output: base };
}
