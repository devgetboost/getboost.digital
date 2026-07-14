import { useMemo, useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { renderPrompt, type PromptTemplate } from '@/lib/agenticPrompts';

const MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { id: 'openai/gpt-5', label: 'GPT-5' },
];

type Props = {
  prompt: PromptTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PromptTestDialog({ prompt, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(prompt.variables.map((v) => [v, `exemplo_${v}`]))
  );
  const [userMessage, setUserMessage] = useState('Olá, dá-me uma resposta de exemplo.');
  const [model, setModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null>(null);

  const rendered = useMemo(() => renderPrompt(prompt.content, values), [prompt.content, values]);

  const run = async () => {
    setLoading(true);
    setReply(null);
    setUsage(null);
    try {
      const { data, error } = await supabase.functions.invoke('agentic-agent-test', {
        body: { systemPrompt: rendered, userMessage, model },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReply(data?.reply ?? '');
      setUsage(data?.usage ?? null);
    } catch (e: any) {
      toast({ title: 'Erro ao testar prompt', description: e?.message ?? 'Tenta novamente', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Testar: {prompt.name}</DialogTitle>
          <DialogDescription>Preenche as variáveis com dados de exemplo e executa uma pré-visualização.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {prompt.variables.length > 0 && (
            <div className="space-y-2">
              <Label>Variáveis</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {prompt.variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label htmlFor={`var-${v}`} className="text-xs text-muted-foreground">{`{{${v}}}`}</Label>
                    <Input
                      id={`var-${v}`}
                      value={values[v] ?? ''}
                      onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Prompt final (system)</Label>
            <Textarea readOnly value={rendered} rows={5} className="font-mono text-xs bg-muted/40" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="user-msg">Mensagem de teste</Label>
              <Textarea
                id="user-msg"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                rows={3}
                maxLength={4000}
              />
            </div>
          </div>

          {reply !== null && (
            <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Resposta</Label>
                {usage?.total_tokens != null && (
                  <span className="text-[10px] text-muted-foreground">
                    {usage.prompt_tokens ?? 0} in · {usage.completion_tokens ?? 0} out · {usage.total_tokens} total
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap text-sm">{reply || <em className="text-muted-foreground">Sem conteúdo</em>}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Fechar</Button>
          <Button onClick={run} disabled={loading || !userMessage.trim()} className="gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> A executar…</> : <><PlayCircle className="h-4 w-4" /> Executar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
