import { z } from 'zod';
import { assertAdmin } from './agenticGuard';

export type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

const KEY = 'agentic_ai_prompts_v1';
const CATS_KEY = 'agentic_ai_prompt_categories_v1';
const VERSIONS_KEY = 'agentic_ai_prompt_versions_v1';
const MAX_VERSIONS = 50;

export type PromptVersion = {
  id: string;
  promptId: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  savedAt: string;
  reason?: string;
};

function readVersions(): PromptVersion[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); } catch { return []; }
}
function writeVersions(items: PromptVersion[]) { localStorage.setItem(VERSIONS_KEY, JSON.stringify(items)); }

function pushVersion(p: PromptTemplate, reason?: string) {
  const all = readVersions();
  all.unshift({
    id: crypto.randomUUID(),
    promptId: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    content: p.content,
    variables: p.variables,
    savedAt: new Date().toISOString(),
    reason,
  });
  // cap per-prompt history
  const byPrompt = new Map<string, number>();
  const kept: PromptVersion[] = [];
  for (const v of all) {
    const c = byPrompt.get(v.promptId) ?? 0;
    if (c < MAX_VERSIONS) { kept.push(v); byPrompt.set(v.promptId, c + 1); }
  }
  writeVersions(kept);
}

export function listVersions(promptId: string): PromptVersion[] {
  return readVersions().filter(v => v.promptId === promptId);
}


function read(): PromptTemplate[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: PromptTemplate[]) { localStorage.setItem(KEY, JSON.stringify(items)); }

function readCats(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CATS_KEY) || '[]'); } catch { return []; }
}
function writeCats(cats: string[]) {
  localStorage.setItem(CATS_KEY, JSON.stringify(Array.from(new Set(cats.map(c => c.trim()).filter(Boolean)))));
}

export function listCategories(): string[] {
  const fromPrompts = read().map(p => p.category?.trim()).filter(Boolean) as string[];
  const all = Array.from(new Set([...readCats(), ...fromPrompts]));
  return all.sort((a, b) => a.localeCompare(b, 'pt'));
}

export async function createCategory(name: string): Promise<string> {
  await assertAdmin();
  const clean = name.trim();
  if (!clean) throw new Error('Nome vazio');
  writeCats([...readCats(), clean]);
  return clean;
}

export async function renameCategory(from: string, to: string): Promise<number> {
  await assertAdmin();
  const src = from.trim();
  const dst = to.trim();
  if (!src || !dst || src === dst) return 0;
  const items = read();
  let changed = 0;
  const now = new Date().toISOString();
  for (const p of items) {
    if ((p.category ?? '').trim() === src) {
      p.category = dst;
      p.updatedAt = now;
      changed++;
    }
  }
  write(items);
  const cats = readCats().map(c => (c === src ? dst : c));
  writeCats(cats);
  return changed;
}

export async function deleteCategory(name: string): Promise<void> {
  await assertAdmin();
  writeCats(readCats().filter(c => c !== name.trim()));
}

export async function assignCategory(promptId: string, category: string): Promise<void> {
  await updatePrompt(promptId, { category: category.trim() });
}


export function extractVariables(content: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) set.add(m[1]);
  return Array.from(set);
}

export function renderPrompt(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => values[k] ?? `{{${k}}}`);
}

export function listPrompts(): PromptTemplate[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getPrompt(id: string) { return read().find(p => p.id === id); }

export async function createPrompt(input: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'>): Promise<PromptTemplate> {
  await assertAdmin();
  const now = new Date().toISOString();
  const item: PromptTemplate = {
    ...input,
    id: crypto.randomUUID(),
    variables: extractVariables(input.content),
    createdAt: now,
    updatedAt: now,
  };
  write([item, ...read()]);
  return item;
}

export async function updatePrompt(id: string, patch: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>): Promise<PromptTemplate | undefined> {
  await assertAdmin();
  const items = read();
  const idx = items.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  const prev = items[idx];
  const contentChanged = patch.content !== undefined && patch.content !== prev.content;
  const metaChanged = ['name', 'description', 'category'].some(
    (k) => (patch as any)[k] !== undefined && (patch as any)[k] !== (prev as any)[k],
  );
  if (contentChanged || metaChanged) pushVersion(prev);
  const merged = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  if (patch.content !== undefined) merged.variables = extractVariables(patch.content);
  items[idx] = merged;
  write(items);
  return merged;
}

export async function deletePrompt(id: string): Promise<void> {
  await assertAdmin();
  write(read().filter(p => p.id !== id));
  writeVersions(readVersions().filter(v => v.promptId !== id));
}

export async function restoreVersion(promptId: string, versionId: string): Promise<PromptTemplate | undefined> {
  await assertAdmin();
  const v = readVersions().find(x => x.id === versionId && x.promptId === promptId);
  if (!v) throw new Error('Versão não encontrada');
  const items = read();
  const idx = items.findIndex(p => p.id === promptId);
  if (idx === -1) throw new Error('Prompt não encontrado');
  pushVersion(items[idx], 'Antes de restaurar');
  const merged: PromptTemplate = {
    ...items[idx],
    name: v.name,
    description: v.description,
    category: v.category,
    content: v.content,
    variables: v.variables,
    updatedAt: new Date().toISOString(),
  };
  items[idx] = merged;
  write(items);
  return merged;
}

export type PromptExport = {
  version: 1;
  exportedAt: string;
  prompts: PromptTemplate[];
};

export function exportPrompts(ids?: string[]): PromptExport {
  const all = read();
  const prompts = ids && ids.length ? all.filter((p) => ids.includes(p.id)) : all;
  return { version: 1, exportedAt: new Date().toISOString(), prompts };
}

export function exportPromptsBlob(ids?: string[]): Blob {
  return new Blob([JSON.stringify(exportPrompts(ids), null, 2)], { type: 'application/json' });
}

export type ImportMode = 'merge' | 'replace';
export type ImportResult = { imported: number; renamed: number; skipped: number; total: number };

const BACKUPS_KEY = 'agentic_ai_prompt_backups_v1';
const MAX_BACKUPS = 10;

export type PromptBackup = {
  id: string;
  createdAt: string;
  reason: string;
  count: number;
  prompts: PromptTemplate[];
};

function readBackups(): PromptBackup[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(BACKUPS_KEY) || '[]'); } catch { return []; }
}
function writeBackups(items: PromptBackup[]) { localStorage.setItem(BACKUPS_KEY, JSON.stringify(items.slice(0, MAX_BACKUPS))); }

export function listBackups(): PromptBackup[] {
  return readBackups().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createBackup(reason = 'Manual'): Promise<PromptBackup> {
  await assertAdmin();
  const snapshot = read();
  const backup: PromptBackup = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    count: snapshot.length,
    prompts: snapshot,
  };
  writeBackups([backup, ...readBackups()]);
  return backup;
}

export async function restoreBackup(id: string): Promise<number> {
  await assertAdmin();
  const b = readBackups().find(x => x.id === id);
  if (!b) throw new Error('Backup não encontrado');
  // snapshot current state before restoring, so restore is itself reversible
  const current = read();
  writeBackups([{
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason: `Antes de restaurar backup de ${new Date(b.createdAt).toLocaleString('pt-PT')}`,
    count: current.length,
    prompts: current,
  }, ...readBackups()]);
  write(b.prompts);
  return b.prompts.length;
}

export async function deleteBackup(id: string): Promise<void> {
  await assertAdmin();
  writeBackups(readBackups().filter(b => b.id !== id));
}

const PromptItemSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, 'nome vazio').max(200, 'nome demasiado longo (máx 200)'),
  description: z.string().max(2000, 'descrição demasiado longa (máx 2000)').optional().default(''),
  category: z.string().max(100, 'categoria demasiado longa (máx 100)').optional().default(''),
  content: z.string().trim().min(1, 'conteúdo vazio').max(50000, 'conteúdo demasiado longo (máx 50000)'),
  variables: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const PromptExportSchema = z.object({
  version: z.literal(1, { errorMap: () => ({ message: 'só é suportada a versão 1' }) }),
  exportedAt: z.string().optional(),
  prompts: z.array(PromptItemSchema).min(1, 'a lista "prompts" está vazia').max(1000, 'demasiados prompts (máx 1000)'),
});

function formatZodError(err: z.ZodError): string {
  const first = err.errors[0];
  if (!first) return 'formato inválido';
  const path = first.path.length ? first.path.join('.') : '(raiz)';
  return `${path}: ${first.message}`;
}

export async function importPrompts(
  raw: string,
  opts: { mode?: ImportMode; backup?: boolean } = {},
): Promise<ImportResult & { backupId?: string }> {
  await assertAdmin();

  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('Ficheiro inválido: não é JSON válido.'); }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Formato inválido: esperado um objeto JSON com "version" e "prompts".');
  }
  if (!('prompts' in (parsed as object))) {
    throw new Error('Formato inválido: falta o campo obrigatório "prompts".');
  }
  if (!('version' in (parsed as object))) {
    throw new Error('Formato inválido: falta o campo obrigatório "version" (deve ser 1).');
  }

  const result = PromptExportSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Estrutura inválida — ${formatZodError(result.error)}`);
  }
  const data = result.data;

  const now = new Date().toISOString();
  const incoming: PromptTemplate[] = data.prompts.map((p) => ({
    id: p.id ?? crypto.randomUUID(),
    name: p.name,
    description: p.description ?? '',
    category: p.category ?? '',
    content: p.content,
    variables: extractVariables(p.content),
    createdAt: p.createdAt ?? now,
    updatedAt: now,
  }));


  const mode: ImportMode = opts.mode ?? 'merge';

  // Backup automático dos prompts atuais antes de qualquer escrita.
  let backupId: string | undefined;
  if (opts.backup !== false) {
    const backup = await createBackup(`Antes de importar (${mode})`);
    backupId = backup.id;
  }

  if (mode === 'replace') {
    write(incoming);
    return { imported: incoming.length, renamed: 0, skipped: 0, total: incoming.length, backupId };
  }

  const current = read();
  const byId = new Map(current.map((p) => [p.id, p]));
  let renamed = 0;
  for (const p of incoming) {
    if (byId.has(p.id)) { p.id = crypto.randomUUID(); renamed++; }
    byId.set(p.id, p);
  }
  write(Array.from(byId.values()));
  return { imported: incoming.length, renamed, skipped: 0, total: incoming.length, backupId };
}


