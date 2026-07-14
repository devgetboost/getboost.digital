import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, KeyRound, Loader2, PlugZap, RefreshCw, Save, Settings2, Trash2, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getSettings, MODELS, PROVIDERS, saveSettings, validateSettings, FAST_MODE_SUPPORTED, modelsForProvider, type AgentSettings, type SettingsErrors } from '@/lib/agenticSettings';
import { useAgenticPermissions } from '@/hooks/useAgenticPermissions';

type TestResult = { ok: boolean; message: string; latency?: number; reply?: string };

const EXTERNAL_KEYS = [
  { name: 'OPENAI_API_KEY', label: 'OpenAI (opcional)', help: 'Só necessário se ignorares o gateway Lovable.' },
  { name: 'ANTHROPIC_API_KEY', label: 'Anthropic (opcional)', help: 'Para usar Claude diretamente.' },
  { name: 'GOOGLE_API_KEY', label: 'Google AI (opcional)', help: 'Para chamar Gemini diretamente.' },
];

type SaveState = 'idle' | 'saving' | 'saved';

export default function AdminAgenticSettings() {
  const { toast } = useToast();
  const { canExecute } = useAgenticPermissions();
  const [s, setS] = useState<AgentSettings>(getSettings());
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [secretStatus, setSecretStatus] = useState<Record<string, boolean>>({});
  const [checkingSecrets, setCheckingSecrets] = useState(false);
  const [secretsError, setSecretsError] = useState<string | null>(null);
  const [secretsCheckedAt, setSecretsCheckedAt] = useState<Date | null>(null);
  const isFirstRender = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reload from storage on mount + sync across tabs.
  useEffect(() => {
    setS(getSettings());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'agentic_ai_settings_v1') setS(getSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Check which provider secrets are configured on the backend.
  const refreshSecretStatus = async () => {
    setCheckingSecrets(true);
    setSecretsError(null);
    try {
      const { data, error } = await supabase.functions.invoke('agentic-check-secrets', {
        body: { names: EXTERNAL_KEYS.map(k => k.name) },
      });
      if (error) throw new Error(error.message);
      if (data?.ok && data.status) {
        setSecretStatus(data.status);
        setSecretsCheckedAt(new Date());
      } else {
        throw new Error(data?.error ?? 'Resposta inesperada');
      }
    } catch (e: any) {
      setSecretsError(e?.message ?? 'Erro ao consultar estado');
    } finally {
      setCheckingSecrets(false);
    }
  };
  useEffect(() => { if (canExecute) refreshSecretStatus(); }, [canExecute]);

  // Auto-save (debounced) whenever settings change — only if valid.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!canExecute) { setSaveState('idle'); return; }
    const result = validateSettings(s);
    setErrors(result.errors ?? {});
    if (!result.ok) {
      setSaveState('idle');
      return;
    }
    setSaveState('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await saveSettings(s);
        setLastSavedAt(new Date());
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1500);
      } catch (e: any) {
        setSaveState('idle');
        toast({ title: 'Não foi possível guardar', description: e?.message ?? 'Erro desconhecido', variant: 'destructive' });
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [s, toast, canExecute]);

  const saveNow = async () => {
    if (!canExecute) { toast({ title: 'Apenas leitura', description: 'Requer perfil admin para guardar.', variant: 'destructive' }); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const result = validateSettings(s);
    setErrors(result.errors ?? {});
    if (!result.ok) {
      const first = Object.values(result.errors ?? {})[0] ?? 'Corrige os campos assinalados';
      toast({ title: 'Valores inválidos', description: first, variant: 'destructive' });
      return;
    }
    try {
      await saveSettings(s);
      setLastSavedAt(new Date());
      setSaveState('saved');
      toast({ title: 'Configurações guardadas' });
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (e: any) {
      setSaveState('idle');
      toast({ title: 'Não foi possível guardar', description: e?.message ?? 'Erro desconhecido', variant: 'destructive' });
    }
  };

  // API key editor dialog state
  const [keyDialogName, setKeyDialogName] = useState<string | null>(null);
  const [keyDialogValue, setKeyDialogValue] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const openKeyDialog = (name: string) => {
    if (!canExecute) { toast({ title: 'Apenas leitura', description: 'Requer perfil admin.', variant: 'destructive' }); return; }
    setKeyDialogValue('');
    setKeyDialogName(name);
  };

  const saveKey = async () => {
    if (!keyDialogName) return;
    const value = keyDialogValue.trim();
    if (value.length < 8) { toast({ title: 'Valor demasiado curto', variant: 'destructive' }); return; }
    setSavingKey(true);
    try {
      const { data, error } = await supabase.functions.invoke('agentic-save-secret', {
        body: { name: keyDialogName, value, action: 'upsert' },
      });
      if (error || !data?.ok) throw new Error(error?.message || data?.error || 'Erro ao guardar');
      toast({ title: 'Chave guardada', description: keyDialogName });
      setKeyDialogName(null);
      setKeyDialogValue('');
      await refreshSecretStatus();
    } catch (e: any) {
      toast({ title: 'Não foi possível guardar', description: e?.message, variant: 'destructive' });
    } finally {
      setSavingKey(false);
    }
  };

  const deleteKey = async (name: string) => {
    if (!canExecute) return;
    if (!confirm(`Remover a chave ${name}?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('agentic-save-secret', {
        body: { name, action: 'delete' },
      });
      if (error || !data?.ok) throw new Error(error?.message || data?.error || 'Erro');
      toast({ title: 'Chave removida', description: name });
      await refreshSecretStatus();
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e?.message, variant: 'destructive' });
    }
  };

  const testConnection = async () => {
    if (!canExecute) { toast({ title: 'Apenas leitura', description: 'Requer perfil admin.', variant: 'destructive' }); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('agentic-test-connection', {
        body: { model: s.defaultModel, fastMode: s.fastMode },
      });
      if (error) {
        setTestResult({ ok: false, message: error.message || 'Falha ao contactar o fornecedor' });
        toast({ title: 'Ligação falhou', description: error.message, variant: 'destructive' });
        return;
      }
      if (data?.ok) {
        setTestResult({ ok: true, message: 'Ligação bem-sucedida', latency: data.latency, reply: data.reply });
        toast({ title: 'Ligação OK', description: `${s.defaultModel} · ${data.latency}ms` });
      } else {
        const msg = data?.error ?? 'Erro desconhecido';
        setTestResult({ ok: false, message: msg, latency: data?.latency });
        toast({ title: 'Ligação falhou', description: msg, variant: 'destructive' });
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Erro inesperado';
      setTestResult({ ok: false, message: msg });
      toast({ title: 'Ligação falhou', description: msg, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const err = (k: keyof AgentSettings) =>
    errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null;


  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Settings2 className="h-6 w-6" /> Configurações Agentic AI</h1>
          <p className="text-sm text-muted-foreground">Escolhe fornecedor, modelo padrão e gere chaves de API.</p>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 min-h-[24px]">
          {saveState === 'saving' && (<><Loader2 className="h-3 w-3 animate-spin" /> A guardar…</>)}
          {saveState === 'saved' && (<><Check className="h-3 w-3 text-green-600" /> Guardado</>)}
          {saveState === 'idle' && lastSavedAt && (<>Guardado às {lastSavedAt.toLocaleTimeString('pt-PT')}</>)}
        </div>
      </div>

      {!canExecute && (
        <div role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          Estás em modo leitura. Requer perfil <code>admin</code> para alterar definições, testar ligação ou adicionar chaves.
        </div>
      )}




      <Card>
        <CardHeader>
          <CardTitle>Fornecedor e modelo</CardTitle>
          <CardDescription>Definições aplicadas por defeito aos novos agentes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select value={s.provider} disabled={!canExecute} onValueChange={(v) => {
              const provider = v as AgentSettings['provider'];
              const available = modelsForProvider(provider);
              const nextModel = available.find(m => m.id === s.defaultModel) ? s.defaultModel : (available[0]?.id ?? s.defaultModel);
              setS({ ...s, provider, defaultModel: nextModel });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Modelo padrão</Label>
            <Select value={s.defaultModel} disabled={!canExecute} onValueChange={(v) => setS({ ...s, defaultModel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {modelsForProvider(s.provider).map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura ({s.temperature})</Label>
              <Input
                id="temperature"
                type="number" min={0} max={2} step={0.1}
                value={s.temperature}
                disabled={!canExecute}
                aria-invalid={!!errors.temperature}
                onChange={(e) => setS({ ...s, temperature: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Entre 0 e 2. Valores altos = respostas mais criativas.</p>
              {err('temperature')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Máx. tokens</Label>
              <Input
                id="maxTokens"
                type="number" min={128} max={32000} step={128}
                value={s.maxTokens}
                disabled={!canExecute}
                aria-invalid={!!errors.maxTokens}
                onChange={(e) => setS({ ...s, maxTokens: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Entre 128 e 32000 tokens por resposta.</p>
              {err('maxTokens')}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <Label className="cursor-pointer">Modo rápido (Fast mode)</Label>
                <p className="text-xs text-muted-foreground">
                  {FAST_MODE_SUPPORTED.includes(s.defaultModel)
                    ? 'Menor latência (custo mais elevado).'
                    : 'Não suportado por este modelo. Seleciona um GPT-5*.'}
                </p>
                {err('fastMode')}
              </div>
            </div>
            <Switch
              checked={s.fastMode}
              disabled={!canExecute || !FAST_MODE_SUPPORTED.includes(s.defaultModel)}
              onCheckedChange={(v) => setS({ ...s, fastMode: v })}
            />
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Chaves de API</CardTitle>
              <CardDescription>
                O gateway Lovable já está ativo com a chave <code>LOVABLE_API_KEY</code> — não precisas de configurar nada para usar Gemini ou GPT.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={refreshSecretStatus} disabled={checkingSecrets || !canExecute} className="gap-2">
              {checkingSecrets ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {checkingSecrets ? 'A consultar…' : 'Recarregar estado'}
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 min-h-[16px]">
            {secretsError
              ? <span className="text-destructive">Erro: {secretsError}</span>
              : secretsCheckedAt
                ? <>Última verificação: {secretsCheckedAt.toLocaleTimeString('pt-PT')}</>
                : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-3 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Lovable AI Gateway</span>
                <Badge>Ativo</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={testConnection} disabled={testing || !canExecute} className="gap-2">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
                {testing ? 'A testar…' : 'Testar ligação'}
              </Button>
            </div>
            {testResult && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                  testResult.ok
                    ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'border-destructive/40 bg-destructive/10 text-destructive'
                }`}
              >
                {testResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}
                <div className="min-w-0">
                  <p className="font-medium">
                    {testResult.message}
                    {typeof testResult.latency === 'number' && ` · ${testResult.latency}ms`}
                  </p>
                  {testResult.ok && testResult.reply && (
                    <p className="text-muted-foreground mt-0.5 truncate">Resposta: “{testResult.reply}”</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {EXTERNAL_KEYS.map(k => {
            const configured = !!secretStatus[k.name];
            return (
              <div key={k.name} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{k.label}</p>
                    {configured && (
                      <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Configurada
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{k.help}</p>
                  <code className="text-[10px] text-muted-foreground">{k.name}</code>
                </div>
                <div className="flex items-center gap-1">
                  {configured && (
                    <Button size="sm" variant="ghost" disabled={!canExecute} onClick={() => deleteKey(k.name)} aria-label="Remover chave">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={!canExecute} onClick={() => openKeyDialog(k.name)}>
                    {configured ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!keyDialogName} onOpenChange={(o) => !o && setKeyDialogName(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar {keyDialogName}</DialogTitle>
            <DialogDescription>
              O valor é guardado no backend (Lovable Cloud) com RLS restrito a admins e nunca é devolvido ao cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="secret-value">Valor da chave</Label>
            <Input
              id="secret-value"
              type="password"
              autoComplete="off"
              value={keyDialogValue}
              onChange={(e) => setKeyDialogValue(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyDialogName(null)} disabled={savingKey}>Cancelar</Button>
            <Button onClick={saveKey} disabled={savingKey} className="gap-2">
              {savingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button onClick={saveNow} disabled={!canExecute} className="gap-2"><Save className="h-4 w-4" /> Guardar agora</Button>
      </div>
    </div>
  );
}
