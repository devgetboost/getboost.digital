// Tradutor de erros do Postgres devolvidos pelo Supabase quando um admin
// tenta agendar/reagendar um rascunho de redes sociais.
// A validação server-side vive num trigger BEFORE INSERT OR UPDATE em
// public.social_media_drafts que faz RAISE com SQLSTATE 22007 quando
// scheduled_at está no passado.

export type DraftErrorLike = { code?: string | null; message?: string | null } | null | undefined;

export function isPastScheduleError(error: DraftErrorLike): boolean {
  if (!error) return false;
  if (error.code === "22007") return true;
  return typeof error.message === "string" && /scheduled_at/i.test(error.message);
}

export function isTikTokVideoUrlError(error: DraftErrorLike): boolean {
  if (!error) return false;
  return typeof error.message === "string" && /tiktok.*video_url|video_url.*tiktok|output\.video_url/i.test(error.message);
}

export function translateDraftError(
  error: DraftErrorLike,
  intent: "scheduled" | "approved" | "rejected" | string,
): string {
  if (!error) return "";
  if (isPastScheduleError(error)) {
    const verb = intent === "scheduled" ? "agendar" : "atualizar";
    return `Não foi possível ${verb}: a data escolhida está no passado. Escolhe uma data/hora futura.`;
  }
  if (isTikTokVideoUrlError(error)) {
    return "TikTok requer um URL público de vídeo (.mp4) em output.video_url antes de aprovar ou agendar. Adiciona o URL no painel do rascunho e tenta novamente.";
  }
  return error.message ?? "Erro desconhecido.";
}
