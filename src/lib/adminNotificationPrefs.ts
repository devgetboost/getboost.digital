// Preferências client-side (localStorage) para notificações do admin.
// Controla que tipos (aprovado/rejeitado/agendado) e que redes sociais
// disparam toasts em AdminSocialMediaDrafts e aparecem no centro de
// notificações (AdminNotifications).

export type NotifType = "approved" | "rejected" | "scheduled";
export type NotifNetwork = "linkedin" | "tiktok" | "x" | "facebook" | "instagram" | "youtube";

export const NOTIF_TYPES: { key: NotifType; label: string }[] = [
  { key: "approved", label: "Aprovado" },
  { key: "rejected", label: "Rejeitado" },
  { key: "scheduled", label: "Agendado" },
];

export const NOTIF_NETWORKS: { key: NotifNetwork; label: string }[] = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
];

export type AdminNotifPrefs = {
  types: Record<NotifType, boolean>;
  networks: Record<NotifNetwork, boolean>;
};

const KEY = "admin_notif_prefs_v1";

export const DEFAULT_PREFS: AdminNotifPrefs = {
  types: { approved: true, rejected: true, scheduled: true },
  networks: {
    linkedin: true, tiktok: true, x: true,
    facebook: true, instagram: true, youtube: true,
  },
};

export function normalizeRede(r?: string | null): NotifNetwork | null {
  const v = (r ?? "").toLowerCase().trim();
  if (!v) return null;
  if (v === "twitter") return "x";
  if ((NOTIF_NETWORKS as { key: string }[]).some(n => n.key === v)) return v as NotifNetwork;
  return null;
}

export function loadPrefs(): AdminNotifPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      types: { ...DEFAULT_PREFS.types, ...(parsed?.types ?? {}) },
      networks: { ...DEFAULT_PREFS.networks, ...(parsed?.networks ?? {}) },
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: AdminNotifPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("admin-notif-prefs-changed"));
}

/** true se o toast/registo deve disparar. Rede desconhecida passa (não bloqueia). */
export function shouldNotify(
  action: string,
  rede: string | null | undefined,
  prefs: AdminNotifPrefs = loadPrefs(),
): boolean {
  const a = action === "rescheduled" ? "scheduled" : action;
  if (a === "approved" || a === "rejected" || a === "scheduled") {
    if (!prefs.types[a as NotifType]) return false;
  }
  const net = normalizeRede(rede);
  if (net && !prefs.networks[net]) return false;
  return true;
}
