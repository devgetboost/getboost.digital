import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Config {
  enabled: boolean;
  default_instance_id: string | null;
  system_prompt: string;
  model: string;
  business_hours_only: boolean;
  business_hours: { start: string; end: string; days: number[]; tz: string };
  offline_message: string;
  max_replies_per_hour: number;
  chunk_strategy: 'paragraph' | 'sentence' | 'char' | 'none';
  chunk_max_chars: number;
  chunk_delay_ms: number;
  max_chunks_per_reply: number;
}

interface Instance {
  id: string;
  name: string;
  connected_number: string | null;
  status: string;
}

const DAYS = [
  { v: 1, l: 'Seg' }, { v: 2, l: 'Ter' }, { v: 3, l: 'Qua' },
  { v: 4, l: 'Qui' }, { v: 5, l: 'Sex' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' },
];

export default function WhatsAppAssistantSettings() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState('Olá, queria saber preços de filmagem com drone.');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('whatsapp_assistant_config')
        .select('*').eq('id', 1).maybeSingle();
      if (data) setCfg(data as any);
      const { data: ins } = await supabase.from('whatsapp_instances')
        .select('id, name, connected_number, status');
      setInstances((ins as Instance[]) || []);
    })();
  }, []);

  if (!cfg) return <div className="text-sm text-muted-foreground">A carregar...</div>;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('whatsapp_assistant_config')
      .update({
        enabled: cfg.enabled,
        default_instance_id: cfg.default_instance_id,
        system_prompt: cfg.system_prompt,
        model: cfg.model,
        business_hours_only: cfg.business_hours_only,
        business_hours: cfg.business_hours,
        offline_message: cfg.offline_message,
        max_replies_per_hour: cfg.max_replies_per_hour,
        chunk_strategy: cfg.chunk_strategy,
        chunk_max_chars: cfg.chunk_max_chars,
        chunk_delay_ms: cfg.chunk_delay_ms,
        max_chunks_per_reply: cfg.max_chunks_per_reply,
      }).eq('id', 1);
    setSaving(false);
    if (error) toast.error('Erro ao guardar'); else toast.success('Configuração guardada');
  }

  async function test() {
    setTesting(true); setTestOutput('');
    const { data, error } = await supabase.functions.invoke('whatsapp-assistant-reply', {
      body: { test_prompt: testInput },
    });
    setTesting(false);
    if (error) { toast.error('Erro no teste: ' + error.message); return; }
    setTestOutput((data as any)?.reply || '(sem resposta)');
  }

  function toggleDay(d: number) {
    const days = cfg!.business_hours.days.includes(d)
      ? cfg!.business_hours.days.filter(x => x !== d)
      : [...cfg!.business_hours.days, d];
    setCfg({ ...cfg!, business_hours: { ...cfg!.business_hours, days } });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> Assistente Virtual WhatsApp
          </CardTitle>
          <CardDescription>
            Responde automaticamente a mensagens recebidas usando IA + conhecimento do site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Ativar assistente</Label>
              <p className="text-sm text-muted-foreground">Master switch — desliga IA para todas as conversas.</p>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Instância padrão</Label>
              <Select
                value={cfg.default_instance_id || ''}
                onValueChange={(v) => setCfg({ ...cfg, default_instance_id: v || null })}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar instância" /></SelectTrigger>
                <SelectContent>
                  {instances.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} {i.connected_number ? `(+${i.connected_number})` : ''} — {i.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Ligue uma instância ao número <strong>+351 963 574 400</strong> em "Configurações".
              </p>
            </div>

            <div>
              <Label>Modelo de IA</Label>
              <Select value={cfg.model} onValueChange={(v) => setCfg({ ...cfg, model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (rápido, recomendado)</SelectItem>
                  <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (mais barato)</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (melhor qualidade)</SelectItem>
                  <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                  <SelectItem value="openai/gpt-5">GPT-5 (premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Prompt de sistema</Label>
            <Textarea
              value={cfg.system_prompt}
              onChange={(e) => setCfg({ ...cfg, system_prompt: e.target.value })}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O conhecimento do site (serviços, preços, FAQ) é adicionado automaticamente em cada resposta.
            </p>
          </div>

          <div>
            <Label>Máximo de respostas por hora (por contacto)</Label>
            <Input
              type="number" min={1} max={100}
              value={cfg.max_replies_per_hour}
              onChange={(e) => setCfg({ ...cfg, max_replies_per_hour: parseInt(e.target.value) || 20 })}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <Label className="text-base">Divisão da resposta em blocos</Label>
              <p className="text-sm text-muted-foreground">Como a resposta da IA é fatiada antes de ser enviada ao WhatsApp.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Estratégia</Label>
                <Select
                  value={cfg.chunk_strategy}
                  onValueChange={(v) => setCfg({ ...cfg, chunk_strategy: v as Config['chunk_strategy'] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paragraph">Por parágrafos (recomendado)</SelectItem>
                    <SelectItem value="sentence">Por frases</SelectItem>
                    <SelectItem value="char">Por número máximo de caracteres</SelectItem>
                    <SelectItem value="none">Sem divisão (uma única mensagem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Máx. caracteres por bloco</Label>
                <Input
                  type="number" min={80} max={1500}
                  value={cfg.chunk_max_chars}
                  onChange={(e) => setCfg({ ...cfg, chunk_max_chars: parseInt(e.target.value) || 350 })}
                />
              </div>
              <div>
                <Label>Delay entre blocos (ms)</Label>
                <Input
                  type="number" min={0} max={10000} step={100}
                  value={cfg.chunk_delay_ms}
                  onChange={(e) => setCfg({ ...cfg, chunk_delay_ms: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Máx. blocos por resposta</Label>
                <Input
                  type="number" min={1} max={10}
                  value={cfg.max_chunks_per_reply}
                  onChange={(e) => setCfg({ ...cfg, max_chunks_per_reply: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
          </div>


          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Apenas horário comercial</Label>
                <p className="text-sm text-muted-foreground">Fora destas horas envia a mensagem offline.</p>
              </div>
              <Switch
                checked={cfg.business_hours_only}
                onCheckedChange={(v) => setCfg({ ...cfg, business_hours_only: v })}
              />
            </div>
            {cfg.business_hours_only && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input
                      type="time" value={cfg.business_hours.start}
                      onChange={(e) => setCfg({ ...cfg, business_hours: { ...cfg.business_hours, start: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input
                      type="time" value={cfg.business_hours.end}
                      onChange={(e) => setCfg({ ...cfg, business_hours: { ...cfg.business_hours, end: e.target.value } })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Dias</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DAYS.map(d => (
                      <button
                        key={d.v}
                        onClick={() => toggleDay(d.v)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          cfg.business_hours.days.includes(d.v)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >{d.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Mensagem offline</Label>
                  <Textarea
                    rows={2}
                    value={cfg.offline_message}
                    onChange={(e) => setCfg({ ...cfg, offline_message: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'A guardar...' : 'Guardar alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Testar resposta
          </CardTitle>
          <CardDescription>Simula a resposta do assistente sem enviar pelo WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={2} value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Escreva uma mensagem como se fosse um cliente..."
          />
          <Button onClick={test} disabled={testing || !testInput.trim()} variant="outline">
            {testing ? 'A gerar...' : 'Gerar resposta'}
          </Button>
          {testOutput && (
            <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap border-l-4 border-primary">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Bot className="h-3 w-3" /> Resposta do assistente
              </p>
              {testOutput}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
