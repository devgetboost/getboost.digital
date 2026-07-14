import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, GitCompare, Copy, History, Undo2 } from 'lucide-react';
import { ArrowLeft, CheckCircle2, XCircle, GitBranch, Play, Send, Archive, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAgent, type Agent } from '@/lib/agenticAgents';
import {
  listVersions,
  createDraftVersion,
  updateVersion,
  setVersionStatus,
  activateVersion,
  rollbackToVersion,
  listAuditEntries,
  type AgentVersion,
  type VersionStatus,
  type AuditEntry,
} from '@/lib/agenticVersions';
import { useAgenticPermissions } from '@/hooks/useAgenticPermissions';

const STATUS_COLORS: Record<VersionStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100',
  reviewed: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100',
  approved: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100',
  archived: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_LABEL: Record<VersionStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Em revisão',
  reviewed: 'Revista',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  archived: 'Arquivada',
};

type DiffLine = { type: 'eq' | 'add' | 'del'; text: string };
function diffLines(a: string, b: string): DiffLine[] {
  const A = (a ?? '').split('\n');
  const B = (b ?? '').split('\n');
  const m = A.length, n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { out.push({ type: 'eq', text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i++] }); }
    else { out.push({ type: 'add', text: B[j++] }); }
  }
  while (i < m) out.push({ type: 'del', text: A[i++] });
  while (j < n) out.push({ type: 'add', text: B[j++] });
  return out;
}


export default function AdminAgenticAIVersions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canExecute } = useAgenticPermissions();
  const [agent, setAgent] = useState<Agent | undefined>();
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [compareId, setCompareId] = useState<string>('');
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const reload = async () => {
    if (!id) return;
    const [a, v, au] = await Promise.all([
      getAgent(id),
      listVersions(id),
      listAuditEntries(id, 100).catch(() => []),
    ]);
    setAgent(a);
    setVersions(v);
    setAudit(au);
    if (!selectedId && v.length) setSelectedId(v[0].id);
  };

  useEffect(() => { reload().catch(() => {}); /* eslint-disable-next-line */ }, [id]);

  const selected = useMemo(() => versions.find((v) => v.id === selectedId), [versions, selectedId]);
  const activeId = agent?.['activeVersionId' as keyof Agent] as unknown as string | undefined;
  // fallback: query agents table via separate hook is overkill; we read agent.activeVersionId via any
  const activeVersionId = (agent as any)?.activeVersionId as string | undefined;

  useEffect(() => {
    setEditPrompt(selected?.systemPrompt ?? '');
  }, [selected?.id]);

  const doNewVersion = async () => {
    if (!id || !agent) return;
    setBusy(true);
    try {
      const base = versions[0] ?? {
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        fastMode: agent.fastMode,
      };
      const v = await createDraftVersion(id, {
        systemPrompt: base.systemPrompt,
        model: (base as any).model ?? agent.model,
        temperature: (base as any).temperature ?? agent.temperature,
        maxTokens: (base as any).maxTokens ?? agent.maxTokens,
        fastMode: (base as any).fastMode ?? agent.fastMode,
      });
      await reload();
      setSelectedId(v.id);
      toast({ title: `Rascunho v${v.version} criado` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const doSave = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await updateVersion(selected.id, { systemPrompt: editPrompt });
      await reload();
      toast({ title: 'Guardado' });
    } catch (e: any) { toast({ title: 'Erro', description: e?.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const doStatus = async (status: VersionStatus) => {
    if (!selected) return;
    setBusy(true);
    try {
      await setVersionStatus(selected.id, status);
      await reload();
      toast({ title: `Estado atualizado: ${STATUS_LABEL[status]}` });
    } catch (e: any) { toast({ title: 'Erro', description: e?.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const doActivate = async () => {
    if (!selected || !id) return;
    setBusy(true);
    try {
      await activateVersion(id, selected.id);
      await reload();
      toast({ title: `v${selected.version} ativa em produção` });
    } catch (e: any) { toast({ title: 'Erro', description: e?.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const doRollback = async (versionId: string, versionNumber: number) => {
    if (!id) return;
    if (!confirm(`Criar novo rascunho a partir da v${versionNumber}? Terás de aprovar e ativar para produção.`)) return;
    setBusy(true);
    try {
      const v = await rollbackToVersion(id, versionId);
      await reload();
      setSelectedId(v.id);
      toast({ title: `Rollback criado como v${v.version} (rascunho)` });
    } catch (e: any) { toast({ title: 'Erro', description: e?.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (!agent) return <div className="p-6">A carregar…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/agentic-ai/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao agente
        </Button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <GitBranch className="h-6 w-6" /> Versões — {agent.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Rever, aprovar e ativar prompts antes de irem para produção.
          </p>
        </div>
        {canExecute && (
          <Button onClick={doNewVersion} disabled={busy} className="gap-2">
            <Plus className="h-4 w-4" /> Nova versão
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Version list */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Versões ({versions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`group relative rounded-md border transition-colors ${
                  selectedId === v.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                }`}
              >
                <button
                  onClick={() => setSelectedId(v.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">v{v.version}</span>
                    {activeVersionId === v.id && (
                      <Badge variant="outline" className="text-xs">Ativa</Badge>
                    )}
                  </div>
                  <Badge className={`mt-1 text-xs ${STATUS_COLORS[v.status]}`} variant="secondary">
                    {STATUS_LABEL[v.status]}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(v.createdAt).toLocaleDateString('pt-PT')}
                  </div>
                </button>
                {canExecute && activeVersionId !== v.id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                    title={`Reverter para v${v.version} (cria novo rascunho)`}
                    onClick={(e) => { e.stopPropagation(); doRollback(v.id, v.version); }}
                    disabled={busy}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem versões ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="space-y-4">
          {selected ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">v{selected.version} — {STATUS_LABEL[selected.status]}</CardTitle>
                  <div className="flex items-center gap-2">
                    {canExecute && selected.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => doStatus('pending_review')} disabled={busy}>
                        <Send className="h-3 w-3 mr-1" /> Submeter revisão
                      </Button>
                    )}
                    {canExecute && selected.status === 'pending_review' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => doStatus('rejected')} disabled={busy}>
                          <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                        </Button>
                        <Button size="sm" onClick={() => doStatus('approved')} disabled={busy}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar
                        </Button>
                      </>
                    )}
                    {canExecute && selected.status === 'approved' && activeVersionId !== selected.id && (
                      <Button size="sm" onClick={doActivate} disabled={busy} className="gap-1">
                        <Play className="h-3 w-3" /> Ativar em produção
                      </Button>
                    )}
                    {canExecute && selected.status !== 'archived' && selected.status !== 'approved' && (
                      <Button size="sm" variant="ghost" onClick={() => doStatus('archived')} disabled={busy}>
                        <Archive className="h-3 w-3 mr-1" /> Arquivar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Modelo</Label>
                    <p className="text-sm">{selected.model ?? '(padrão)'} • temp {selected.temperature ?? '—'} • {selected.maxTokens ?? '—'} tokens</p>
                  </div>
                  <div>
                    <Label htmlFor="prompt">System prompt</Label>
                    <Textarea
                      id="prompt"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={16}
                      disabled={!canExecute || selected.status === 'archived' || selected.status === 'approved'}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Versões aprovadas ou arquivadas são imutáveis — cria nova versão para alterar.
                    </p>
                  </div>
                  {canExecute && selected.status !== 'archived' && selected.status !== 'approved' && (
                    <Button onClick={doSave} disabled={busy || editPrompt === selected.systemPrompt}>
                      Guardar alterações
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhes desta versão</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Estado atual:</span> <Badge className={STATUS_COLORS[selected.status]} variant="secondary">{STATUS_LABEL[selected.status]}</Badge></div>
                  <div><span className="text-muted-foreground">Ativa em produção:</span> {activeVersionId === selected.id ? 'Sim' : 'Não'}</div>
                  <div><span className="text-muted-foreground">Criada:</span> {new Date(selected.createdAt).toLocaleString('pt-PT')}</div>
                  <div><span className="text-muted-foreground">Atualizada:</span> {new Date(selected.updatedAt).toLocaleString('pt-PT')}</div>
                  <div><span className="text-muted-foreground">Aprovada em:</span> {selected.approvedAt ? new Date(selected.approvedAt).toLocaleString('pt-PT') : '—'}</div>
                  <div className="truncate"><span className="text-muted-foreground">Aprovada por:</span> {selected.approvedBy ?? '—'}</div>
                  {selected.notes && <div className="col-span-2"><span className="text-muted-foreground">Notas:</span> {selected.notes}</div>}
                </CardContent>
              </Card>

              {(() => {
                const other = versions.find((v) => v.id === compareId);
                const cfgRow = (label: string, a: unknown, b: unknown) => {
                  const av = String(a ?? '—');
                  const bv = String(b ?? '—');
                  const changed = !!other && av !== bv;
                  return (
                    <tr
                      className={changed ? 'bg-primary/10' : ''}
                      aria-label={changed ? `${label} alterado: de ${av} para ${bv}` : undefined}
                    >
                      <th scope="row" className="text-left font-normal text-muted-foreground py-1 pr-2 align-top">
                        {label}
                        {changed && <span className="sr-only"> (alterado)</span>}
                      </th>
                      <td className="font-mono py-1 pr-2 align-top">{av}</td>
                      <td className={`font-mono py-1 align-top ${changed ? 'font-semibold text-foreground' : ''}`}>{bv}</td>
                    </tr>
                  );
                };
                const diff = other ? diffLines(other.systemPrompt, selected.systemPrompt) : [];
                const addCount = diff.filter((d) => d.type === 'add').length;
                const delCount = diff.filter((d) => d.type === 'del').length;
                const compareSelectId = `compare-version-${selected.id}`;
                return (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitCompare className="h-4 w-4" aria-hidden="true" /> Comparar versões
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={compareSelectId} className="text-xs text-muted-foreground">
                          Comparar v{selected.version} com
                        </Label>
                        <Select value={compareId || undefined} onValueChange={(v) => setCompareId(v)}>
                          <SelectTrigger id={compareSelectId} className="h-9 w-[220px] text-xs" aria-label="Escolher versão para comparar">
                            <SelectValue placeholder="— escolher versão —" />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.filter((v) => v.id !== selected.id).map((v) => (
                              <SelectItem key={v.id} value={v.id}>v{v.version} · {STATUS_LABEL[v.status]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {compareId && (
                          <Button size="sm" variant="ghost" onClick={() => setCompareId('')} aria-label="Limpar comparação">
                            Limpar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!other ? (
                        <p className="text-sm text-muted-foreground">Escolhe outra versão para veres as diferenças no prompt e nas configurações.</p>
                      ) : (
                        <section aria-label={`Comparação entre v${other.version} e v${selected.version}`} className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <caption className="sr-only">Diferenças de configuração entre v{other.version} e v{selected.version}</caption>
                              <thead>
                                <tr className="border-b">
                                  <th scope="col" className="text-left font-semibold py-1 pr-2">Configuração</th>
                                  <th scope="col" className="text-left font-semibold py-1 pr-2">v{other.version} (base)</th>
                                  <th scope="col" className="text-left font-semibold py-1">v{selected.version} (atual)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cfgRow('Estado', STATUS_LABEL[other.status], STATUS_LABEL[selected.status])}
                                {cfgRow('Modelo', other.model, selected.model)}
                                {cfgRow('Temperatura', other.temperature, selected.temperature)}
                                {cfgRow('Max tokens', other.maxTokens, selected.maxTokens)}
                                {cfgRow('Fast mode', other.fastMode, selected.fastMode)}
                              </tbody>
                            </table>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs font-semibold">Diff do system prompt</div>
                              <div className="text-xs" aria-live="polite">
                                <span className="text-foreground">
                                  <span aria-hidden="true">+</span>
                                  <span className="sr-only">Adicionadas </span>{addCount}
                                </span>
                                {' · '}
                                <span className="text-foreground">
                                  <span aria-hidden="true">−</span>
                                  <span className="sr-only">Removidas </span>{delCount}
                                </span>
                                <span className="sr-only"> linhas</span>
                              </div>
                            </div>
                            <div
                              className="rounded-md border bg-muted/30 max-h-96 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              tabIndex={0}
                              role="region"
                              aria-label={`Diff do system prompt: ${addCount} adições, ${delCount} remoções`}
                            >
                              {diff.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-3">Prompts vazios.</p>
                              ) : addCount + delCount === 0 ? (
                                <p className="text-xs text-muted-foreground p-3">Sem diferenças no prompt.</p>
                              ) : (
                                <ol className="text-xs font-mono list-none m-0 p-0">
                                  {diff.map((d, i) => {
                                    const isAdd = d.type === 'add';
                                    const isDel = d.type === 'del';
                                    const cls = isAdd
                                      ? 'bg-primary/15 text-foreground border-l-4 border-primary font-medium'
                                      : isDel
                                      ? 'bg-destructive/15 text-foreground border-l-4 border-destructive font-medium line-through decoration-destructive/60'
                                      : 'border-l-4 border-transparent text-muted-foreground';
                                    return (
                                      <li key={i} className={`${cls} px-2 py-0.5 whitespace-pre-wrap break-words`}>
                                        <span className="sr-only">
                                          {isAdd ? 'Adicionada: ' : isDel ? 'Removida: ' : 'Igual: '}
                                        </span>
                                        <span aria-hidden="true" className="select-none opacity-70 mr-2 inline-block w-3">
                                          {isAdd ? '+' : isDel ? '−' : ' '}
                                        </span>
                                        {d.text || ' '}
                                      </li>
                                    );
                                  })}
                                </ol>
                              )}
                            </div>
                          </div>
                        </section>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}



              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico de versões do agente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="relative border-l border-border ml-2 space-y-4">
                    {versions.map((v) => {
                      const open = !!expandedPrompts[v.id];
                      return (
                      <li key={v.id} className="ml-4">
                        <span className={`absolute -left-1.5 h-3 w-3 rounded-full ${activeVersionId === v.id ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => setSelectedId(v.id)} className="font-medium text-sm hover:underline">v{v.version}</button>
                          <Badge className={`text-xs ${STATUS_COLORS[v.status]}`} variant="secondary">{STATUS_LABEL[v.status]}</Badge>
                          {activeVersionId === v.id && <Badge variant="outline" className="text-xs">Ativa</Badge>}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs gap-1 ml-auto"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(v.systemPrompt ?? '');
                                toast({ title: `Prompt v${v.version} copiado` });
                              } catch {
                                toast({ title: 'Não foi possível copiar', variant: 'destructive' });
                              }
                            }}
                            title="Copiar prompt completo"
                          >
                            <Copy className="h-3 w-3" /> Copiar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => setExpandedPrompts((p) => ({ ...p, [v.id]: !p[v.id] }))}
                            aria-expanded={open}
                          >
                            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            {open ? 'Ocultar prompt' : 'Ver prompt'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Criada {new Date(v.createdAt).toLocaleString('pt-PT')} · Atualizada {new Date(v.updatedAt).toLocaleString('pt-PT')}
                          {v.approvedAt && ` · Aprovada ${new Date(v.approvedAt).toLocaleString('pt-PT')}`}
                        </p>
                        {open && (
                          <div className="mt-2 rounded-md border bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground mb-1">
                              Modelo: {v.model ?? '(padrão)'} · temp {v.temperature ?? '—'} · {v.maxTokens ?? '—'} tokens
                            </div>
                            <pre className="text-xs font-mono whitespace-pre-wrap max-h-64 overflow-auto">{v.systemPrompt || '(vazio)'}</pre>
                            {v.notes && <p className="text-xs mt-2"><span className="text-muted-foreground">Notas:</span> {v.notes}</p>}
                          </div>
                        )}
                      </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Seleciona uma versão à esquerda.</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" /> Auditoria ({audit.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registos de auditoria.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {audit.map((a) => {
                const v = versions.find((x) => x.id === a.versionId);
                return (
                  <li key={a.id} className="flex items-start gap-3 border-l-2 border-muted pl-3 py-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap w-40">
                      {new Date(a.createdAt).toLocaleString('pt-PT')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{a.action}</Badge>
                        {v && <span className="text-xs font-medium">v{v.version}</span>}
                        {a.fromStatus && a.toStatus && (
                          <span className="text-xs text-muted-foreground">
                            {STATUS_LABEL[a.fromStatus as VersionStatus] ?? a.fromStatus}
                            {' → '}
                            {STATUS_LABEL[a.toStatus as VersionStatus] ?? a.toStatus}
                          </span>
                        )}
                      </div>
                      {a.actorId && (
                        <div className="text-xs text-muted-foreground truncate">por {a.actorId}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
