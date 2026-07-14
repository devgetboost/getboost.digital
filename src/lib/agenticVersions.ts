import { supabase } from '@/integrations/supabase/client';
import { assertAdmin, assertReviewer } from './agenticGuard';

export type VersionStatus = 'draft' | 'pending_review' | 'reviewed' | 'approved' | 'rejected' | 'archived';

export type AgentVersion = {
  id: string;
  agentId: string;
  version: number;
  systemPrompt: string;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  fastMode: boolean | null;
  status: VersionStatus;
  notes: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  agent_id: string;
  version: number;
  system_prompt: string;
  model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  fast_mode: boolean | null;
  status: VersionStatus;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

const fromRow = (r: Row): AgentVersion => ({
  id: r.id,
  agentId: r.agent_id,
  version: r.version,
  systemPrompt: r.system_prompt,
  model: r.model,
  temperature: r.temperature,
  maxTokens: r.max_tokens,
  fastMode: r.fast_mode,
  status: r.status,
  notes: r.notes,
  createdBy: r.created_by,
  approvedBy: r.approved_by,
  approvedAt: r.approved_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listVersions(agentId: string): Promise<AgentVersion[]> {
  const { data, error } = await supabase
    .from('agentic_agent_versions')
    .select('*')
    .eq('agent_id', agentId)
    .order('version', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function getVersion(id: string): Promise<AgentVersion | undefined> {
  const { data, error } = await supabase
    .from('agentic_agent_versions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : undefined;
}

export async function createDraftVersion(
  agentId: string,
  base: Partial<Omit<AgentVersion, 'id' | 'createdAt' | 'updatedAt' | 'agentId' | 'version'>>
): Promise<AgentVersion> {
  await assertAdmin();
  const { data: existing } = await supabase
    .from('agentic_agent_versions')
    .select('version')
    .eq('agent_id', agentId)
    .order('version', { ascending: false })
    .limit(1);
  const nextVersion = ((existing?.[0]?.version as number | undefined) ?? 0) + 1;
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('agentic_agent_versions')
    .insert({
      agent_id: agentId,
      version: nextVersion,
      system_prompt: base.systemPrompt ?? '',
      model: base.model ?? null,
      temperature: base.temperature ?? null,
      max_tokens: base.maxTokens ?? null,
      fast_mode: base.fastMode ?? null,
      status: 'draft',
      notes: base.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function updateVersion(
  id: string,
  patch: Partial<Pick<AgentVersion, 'systemPrompt' | 'model' | 'temperature' | 'maxTokens' | 'fastMode' | 'notes'>>
): Promise<void> {
  await assertAdmin();
  const { error } = await supabase
    .from('agentic_agent_versions')
    .update({
      ...(patch.systemPrompt !== undefined && { system_prompt: patch.systemPrompt }),
      ...(patch.model !== undefined && { model: patch.model }),
      ...(patch.temperature !== undefined && { temperature: patch.temperature }),
      ...(patch.maxTokens !== undefined && { max_tokens: patch.maxTokens }),
      ...(patch.fastMode !== undefined && { fast_mode: patch.fastMode }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
    })
    .eq('id', id);
  if (error) throw error;
}

/**
 * State machine:
 *   draft/rejected -> pending_review  (reviewer or admin)
 *   pending_review -> reviewed        (reviewer or admin; marks review complete)
 *   reviewed       -> approved        (admin only; final approval)
 *   any (non-archived) -> rejected/archived
 * Only `approved` versions can be activated in production.
 */
export async function setVersionStatus(id: string, status: VersionStatus): Promise<void> {
  const current = await getVersion(id);
  if (!current) throw new Error('Versão não encontrada.');

  // Approval is admin-only; every other transition requires reviewer or admin.
  if (status === 'approved') {
    await assertAdmin();
    if (current.status !== 'reviewed') {
      throw new Error('A versão tem de estar "revista" antes de ser aprovada.');
    }
  } else {
    await assertReviewer();
    if (status === 'reviewed' && current.status !== 'pending_review') {
      throw new Error('Só versões "em revisão" podem passar a "revistas".');
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  const patch: Record<string, unknown> = { status };
  if (status === 'reviewed') { patch.reviewed_by = user?.id ?? null; patch.reviewed_at = new Date().toISOString(); }
  if (status === 'approved') { patch.approved_by = user?.id ?? null; patch.approved_at = new Date().toISOString(); }

  const { error } = await supabase.from('agentic_agent_versions').update(patch as any).eq('id', id);
  if (error) throw error;
}

export async function activateVersion(agentId: string, versionId: string): Promise<void> {
  await assertAdmin();
  const v = await getVersion(versionId);
  if (!v || v.status !== 'approved') {
    throw new Error('Só versões aprovadas podem ser ativadas em produção.');
  }
  const { error } = await supabase
    .from('agentic_agents')
    .update({ active_version_id: versionId })
    .eq('id', agentId);
  if (error) throw error;
}

/**
 * Cria um novo draft clonado a partir de uma versão existente (para rollback).
 * A versão nova entra como 'draft' e ainda precisa de passar pelo fluxo de aprovação
 * para poder ser ativada em produção.
 */
export async function rollbackToVersion(agentId: string, versionId: string): Promise<AgentVersion> {
  await assertAdmin();
  const src = await getVersion(versionId);
  if (!src || src.agentId !== agentId) throw new Error('Versão inválida para este agente.');
  const clone = await createDraftVersion(agentId, {
    systemPrompt: src.systemPrompt,
    model: src.model,
    temperature: src.temperature,
    maxTokens: src.maxTokens,
    fastMode: src.fastMode,
    notes: `Rollback de v${src.version}${src.notes ? ` — ${src.notes}` : ''}`,
  });
  return clone;
}

// ---------------- Audit log ----------------

export type AuditEntry = {
  id: string;
  agentId: string;
  versionId: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function listAuditEntries(agentId: string, limit = 50): Promise<AuditEntry[]> {
  const { data, error } = await (supabase as any)
    .from('agentic_agent_audit')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    agentId: r.agent_id,
    versionId: r.version_id,
    action: r.action,
    fromStatus: r.from_status,
    toStatus: r.to_status,
    actorId: r.actor_id,
    metadata: r.metadata ?? {},
    createdAt: r.created_at,
  }));
}
