import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Copy, Eye, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  createPrompt, deletePrompt, extractVariables, getPrompt, listCategories, renderPrompt, updatePrompt,
} from '@/lib/agenticPrompts';
import PromptHistoryDialog from '@/components/admin/PromptHistoryDialog';


type Props = { mode: 'new' | 'edit' };

export default function AdminAgenticPromptEditor({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('Escreve o teu template aqui. Usa {{variavel}} para inserir campos dinâmicos.');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(mode === 'new');

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    const p = getPrompt(id);
    if (!p) { toast({ title: 'Prompt não encontrado', variant: 'destructive' }); navigate('/admin/agentic-ai/prompts'); return; }
    setName(p.name); setDescription(p.description); setCategory(p.category); setContent(p.content);
    setLoaded(true);
  }, [id, mode, navigate, toast]);

  const variables = useMemo(() => extractVariables(content), [content]);
  const preview = useMemo(() => renderPrompt(content, values), [content, values]);

  const warnings = useMemo(() => {
    const list: string[] = [];

    // 1. Unfilled variables
    const unfilled = variables.filter(v => !(values[v] ?? '').trim());
    if (unfilled.length) list.push(`Variáveis por preencher: ${unfilled.map(v => `{{${v}}}`).join(', ')}`);

    // 2. Malformed placeholders: {var}, {{ }}, {{var, {{var-name}}
    const malformed = new Set<string>();
    // single-brace placeholders like {foo}
    for (const m of content.matchAll(/(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})/g)) malformed.add(m[0]);
    // unclosed {{ ... without }}
    for (const m of content.matchAll(/\{\{[^}]*$/gm)) malformed.add(m[0].slice(0, 20));
    // empty {{}} or {{  }}
    for (const m of content.matchAll(/\{\{\s*\}\}/g)) malformed.add(m[0]);
    // invalid chars (hyphens, spaces, dots)
    for (const m of content.matchAll(/\{\{\s*([^a-zA-Z0-9_}\s][^}]*|[a-zA-Z0-9_]+[^a-zA-Z0-9_}\s][^}]*)\s*\}\}/g)) malformed.add(m[0]);
    if (malformed.size) list.push(`Sintaxe inválida: ${Array.from(malformed).slice(0, 3).join(', ')} (usa apenas letras, números e _)`);

    // 3. Inconsistent names (case/underscore duplicates)
    const norm = new Map<string, string[]>();
    for (const v of variables) {
      const k = v.toLowerCase().replace(/_/g, '');
      const arr = norm.get(k) ?? [];
      arr.push(v);
      norm.set(k, arr);
    }
    const dupes = Array.from(norm.values()).filter(arr => arr.length > 1);
    if (dupes.length) list.push(`Nomes inconsistentes: ${dupes.map(d => d.join(' ≈ ')).join('; ')}`);

    return list;
  }, [content, variables, values]);

  const save = async () => {
    if (!name.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    try {
      if (mode === 'new') {
        const p = await createPrompt({ name: name.trim(), description: description.trim(), category: category.trim(), content });
        toast({ title: 'Prompt criado' });
        navigate(`/admin/agentic-ai/prompts/${p.id}`);
      } else if (id) {
        await updatePrompt(id, { name: name.trim(), description: description.trim(), category: category.trim(), content });
        toast({ title: 'Alterações guardadas' });
      }
    } catch (e: any) {
      toast({ title: 'Acesso negado', description: e?.message ?? 'Requer admin', variant: 'destructive' });
    }
  };

  const remove = async () => {
    if (!id || !confirm('Eliminar este prompt?')) return;
    try {
      await deletePrompt(id);
      toast({ title: 'Prompt eliminado' });
      navigate('/admin/agentic-ai/prompts');
    } catch (e: any) {
      toast({ title: 'Acesso negado', description: e?.message ?? 'Requer admin', variant: 'destructive' });
    }
  };

  const copyPreview = () => {
    navigator.clipboard.writeText(preview);
    toast({ title: 'Pré-visualização copiada' });
  };

  if (!loaded) return <div className="p-6">A carregar...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai/prompts" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à biblioteca
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{mode === 'new' ? 'Novo prompt' : 'Editar prompt'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Email de boas-vindas" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="ex: Vendas"
                  list="prompt-categories"
                />
                <datalist id="prompt-categories">
                  {listCategories().map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Curta descrição" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Textarea rows={14} value={content} onChange={(e) => setContent(e.target.value)} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Usa <code>{'{{variavel}}'}</code> para criar campos dinâmicos.</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {variables.length === 0 ? (
                <span className="text-xs text-muted-foreground">Sem variáveis detetadas</span>
              ) : variables.map(v => <Badge key={v} variant="secondary">{v}</Badge>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variables.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs uppercase text-muted-foreground">Valores das variáveis</Label>
                {variables.map(v => (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs">{v}</Label>
                    <Input
                      value={values[v] ?? ''}
                      onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                      placeholder={`Valor para ${v}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-md border bg-muted/30 p-4 whitespace-pre-wrap text-sm min-h-[200px]">
              {preview}
            </div>
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4" /> {warnings.length} aviso{warnings.length > 1 ? 's' : ''}
                </div>
                <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc pl-5 space-y-0.5">
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={copyPreview} className="gap-2">
              <Copy className="h-4 w-4" /> Copiar pré-visualização
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        {mode === 'edit' ? (
          <Button variant="outline" onClick={remove} className="text-destructive hover:text-destructive gap-2">
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        ) : <span />}
        <div className="flex items-center gap-2">
          {mode === 'edit' && id && (
            <PromptHistoryDialog
              promptId={id}
              onRestored={() => {
                const p = getPrompt(id);
                if (p) { setName(p.name); setDescription(p.description); setCategory(p.category); setContent(p.content); }
              }}
            />
          )}
          <Button onClick={save} className="gap-2"><Save className="h-4 w-4" /> {mode === 'new' ? 'Criar prompt' : 'Guardar'}</Button>
        </div>
      </div>

    </div>
  );
}
