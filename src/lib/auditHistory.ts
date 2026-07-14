// Histórico local das auditorias comerciais (localStorage, sem backend)
export type StoredAuditContact = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
};

export type StoredAuditReport = {
  score: number;
  verdict: string;
  strengths: string[];
  gaps: { title: string; detail: string }[];
  recommendations: { title: string; impact: string; effort: string; detail: string }[];
  projection: { revenueUplift: string; timeSaved: string; paybackMonths: string };
  nextStep: string;
};

export type StoredAudit = {
  id: string;
  createdAt: string; // ISO
  contact: StoredAuditContact;
  answers: Record<string, string>;
  report: StoredAuditReport;
};

const KEY = 'getboost:commercial-audits';

export function getAudits(): StoredAudit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAudit(entry: Omit<StoredAudit, 'id' | 'createdAt'>): StoredAudit {
  const item: StoredAudit = {
    id: (crypto?.randomUUID?.() ?? String(Date.now() + Math.random())),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const list = getAudits();
  list.unshift(item);
  // guardar no máximo 30
  const trimmed = list.slice(0, 30);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota
  }
  return item;
}

export function deleteAudit(id: string) {
  const list = getAudits().filter((a) => a.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearAudits() {
  window.localStorage.removeItem(KEY);
}
