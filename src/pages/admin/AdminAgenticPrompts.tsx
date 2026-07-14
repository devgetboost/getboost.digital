import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookText, ClipboardPaste, Download, FileJson, FolderCog, History, Link2, Loader2, PlayCircle, Plus, RotateCcw, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { assignCategory, createPrompt, deletePrompt, deleteBackup, exportPromptsBlob, importPrompts, listBackups, listCategories, listPrompts, restoreBackup, type ImportMode, type PromptBackup, type PromptTemplate } from '@/lib/agenticPrompts';
import { PROMPT_CATALOG, type CatalogTemplate } from '@/lib/promptTemplateCatalog';
import PromptTestDialog from '@/components/admin/PromptTestDialog';
import CategoriesManagerDialog from '@/components/admin/CategoriesManagerDialog';

export default function AdminAgenticPrompts() {
  const [items, setItems] = useState<PromptTemplate[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [testing, setTesting] = useState<PromptTemplate | null>(null);
  const [managingCats, setManagingCats] = useState(false);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [backups, setBackups] = useState<PromptBackup[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<'file' | 'paste' | 'url'>('file');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [pastedJson, setPastedJson] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQ, setCatalogQ] = useState('');
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const reload = () => setItems(listPrompts());
  useEffect(() => { reload(); }, []);

  const handleExport = () => {
    const blob = exportPromptsBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: `${items.length} prompt(s) transferidos` });
  };

  const runImport = async (raw: string, sourceLabel: string) => {
    setImporting(true);
    try {
      const res = await importPrompts(raw, { mode: importMode });
      reload();
      setImportOpen(false);
      setPastedJson('');
      setImportUrl('');
      toast({
        title: 'Importação concluída',
        description: `${sourceLabel}: ${res.imported} importados${res.renamed ? ` · ${res.renamed} com novo ID` : ''}${res.backupId ? ' · backup criado' : ''}`,
      });
    } catch (e: any) {
      toast({ title: 'Erro ao importar', description: e?.message ?? 'Ficheiro inválido', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    const raw = await file.text();
    await runImport(raw, file.name);
  };

  const handleImportPaste = async () => {
    if (!pastedJson.trim()) { toast({ title: 'Cola o JSON primeiro', variant: 'destructive' }); return; }
    await runImport(pastedJson, 'JSON colado');
  };

  const handleImportUrl = async () => {
    const url = importUrl.trim();
    if (!/^https?:\/\//i.test(url)) { toast({ title: 'URL inválido', description: 'Usa http:// ou https://', variant: 'destructive' }); return; }
    setImporting(true);
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const raw = await r.text();
      await runImport(raw, url);
    } catch (e: any) {
      toast({ title: 'Erro ao obter URL', description: e?.message ?? 'Falha de rede/CORS', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };


  const openBackups = () => { setBackups(listBackups()); setBackupsOpen(true); };
  const doRestoreBackup = async (id: string) => {
    if (!confirm('Restaurar este backup? Os prompts atuais serão substituídos (será feito um novo backup automático primeiro).')) return;
    try {
      const n = await restoreBackup(id);
      reload();
      setBackups(listBackups());
      toast({ title: 'Backup restaurado', description: `${n} prompt(s) repostos` });
    } catch (e: any) {
      toast({ title: 'Erro ao restaurar', description: e?.message, variant: 'destructive' });
    }
  };
  const doDeleteBackup = async (id: string) => {
    if (!confirm('Eliminar este backup?')) return;
    try { await deleteBackup(id); setBackups(listBackups()); }
    catch (e: any) { toast({ title: 'Erro', description: e?.message, variant: 'destructive' }); }
  };


  const categories = useMemo(() => {
    const known = listCategories();
    const fromPrompts = items.map(p => p.category?.trim()).filter(Boolean) as string[];
    return Array.from(new Set([...known, ...fromPrompts])).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [items, managingCats]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(p => {
      const c = p.category?.trim() || '__none__';
      map[c] = (map[c] ?? 0) + 1;
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(p => {
      if (category === '__none__') { if (p.category?.trim()) return false; }
      else if (category !== 'all' && p.category !== category) return false;
      if (!needle) return true;
      return (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(needle);
    });
  }, [items, q, category]);

  const remove = async (id: string) => {
    if (!confirm('Eliminar este prompt?')) return;
    try {
      await deletePrompt(id);
      setItems(listPrompts());
      toast({ title: 'Prompt eliminado' });
    } catch (e: any) {
      toast({ title: 'Acesso negado', description: e?.message ?? 'Requer admin', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><BookText className="h-6 w-6" /> Biblioteca de Prompts</h1>
          <p className="text-sm text-muted-foreground">Cria, edita e pré-visualiza templates reutilizáveis.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={items.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" onClick={openBackups} className="gap-2">
            <History className="h-4 w-4" /> Backups
          </Button>
          <Button variant="outline" onClick={() => setManagingCats(true)} className="gap-2">
            <FolderCog className="h-4 w-4" /> Gerir categorias
          </Button>
          <Button variant="outline" onClick={() => setCatalogOpen(true)} className="gap-2">
            <Sparkles className="h-4 w-4" /> Templates ({PROMPT_CATALOG.length})
          </Button>
          <Button onClick={() => navigate('/admin/agentic-ai/prompts/novo')} className="gap-2">
            <Plus className="h-4 w-4" /> Novo prompt
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar prompts..." className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias ({items.length})</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c} ({categoryCounts[c] ?? 0})</SelectItem>
            ))}
            {(categoryCounts.__none__ ?? 0) > 0 && (
              <SelectItem value="__none__">Sem categoria ({categoryCounts.__none__})</SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">
          {filtered.length} {filtered.length === 1 ? 'prompt' : 'prompts'}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={category === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategory('all')}
          >
            Todas
          </Badge>
          {categories.map(c => (
            <Badge
              key={c}
              variant={category === c ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategory(c)}
            >
              {c} ({categoryCounts[c] ?? 0})
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <BookText className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Ainda não tens prompts</p>
              <p className="text-sm text-muted-foreground">Cria o teu primeiro template para começar.</p>
            </div>
            <Button onClick={() => navigate('/admin/agentic-ai/prompts/novo')} className="gap-2">
              <Plus className="h-4 w-4" /> Criar prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{p.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{p.description || 'Sem descrição'}</CardDescription>
                  </div>
                  {p.category && <Badge variant="secondary">{p.category}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Categoria:</span>
                  <Select
                    value={p.category || '__none__'}
                    onValueChange={async (v) => {
                      try {
                        await assignCategory(p.id, v === '__none__' ? '' : v);
                        reload();
                        toast({ title: 'Categoria atualizada' });
                      } catch (e: any) {
                        toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem categoria</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.variables.length} variáveis</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setTesting(p)} className="gap-1" title="Testar prompt">
                      <PlayCircle className="h-4 w-4" /> Testar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link to={`/admin/agentic-ai/prompts/${p.id}`}>
                      <Button variant="outline" size="sm">Abrir</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {testing && (
        <PromptTestDialog
          key={testing.id}
          prompt={testing}
          open={!!testing}
          onOpenChange={(o) => { if (!o) setTesting(null); }}
        />
      )}

      <CategoriesManagerDialog
        open={managingCats}
        onOpenChange={setManagingCats}
        onChanged={reload}
      />

      <Dialog open={backupsOpen} onOpenChange={setBackupsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Backups de prompts</DialogTitle>
            <DialogDescription>
              Criados automaticamente antes de cada importação. Mantidos os 10 mais recentes.
            </DialogDescription>
          </DialogHeader>
          {backups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem backups ainda. O próximo será criado na próxima importação.</p>
          ) : (
            <ul className="divide-y max-h-[60vh] overflow-auto">
              {backups.map(b => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.createdAt).toLocaleString('pt-PT')} · {b.count} prompt(s)
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => doRestoreBackup(b.id)} className="gap-1">
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => doDeleteBackup(b.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(o) => { if (!importing) setImportOpen(o); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Importar prompts</DialogTitle>
            <DialogDescription>
              Aceita JSON exportado desta biblioteca. Será criado um backup automático antes de escrever.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm">Modo:</Label>
            <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
              <SelectTrigger className="w-[220px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Juntar (IDs duplicados renomeados)</SelectItem>
                <SelectItem value="replace">Substituir tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={importTab} onValueChange={(v) => setImportTab(v as typeof importTab)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="file" className="gap-1"><FileJson className="h-3.5 w-3.5" /> Ficheiro</TabsTrigger>
              <TabsTrigger value="paste" className="gap-1"><ClipboardPaste className="h-3.5 w-3.5" /> Colar</TabsTrigger>
              <TabsTrigger value="url" className="gap-1"><Link2 className="h-3.5 w-3.5" /> URL</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-2 pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                  e.target.value = '';
                }}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-2 w-full">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Selecionar ficheiro .json
              </Button>
            </TabsContent>

            <TabsContent value="paste" className="space-y-2 pt-3">
              <Textarea
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder='{"version":1,"prompts":[...]}'
                rows={10}
                className="font-mono text-xs"
              />
              <div className="flex justify-end">
                <Button onClick={handleImportPaste} disabled={importing || !pastedJson.trim()} className="gap-2">
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
                  Importar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-2 pt-3">
              <Input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://exemplo.com/prompts.json"
              />
              <p className="text-xs text-muted-foreground">O servidor precisa de responder JSON e permitir CORS.</p>
              <div className="flex justify-end">
                <Button onClick={handleImportUrl} disabled={importing || !importUrl.trim()} className="gap-2">
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Obter e importar
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={importing}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Templates prontos</DialogTitle>
            <DialogDescription>
              Adiciona um template curado à tua biblioteca com 1 clique. Podes editá-lo depois.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={catalogQ} onChange={(e) => setCatalogQ(e.target.value)} placeholder="Procurar templates..." className="pl-9" />
          </div>
          <div className="overflow-y-auto space-y-2 pr-1">
            {PROMPT_CATALOG
              .filter(t => {
                const s = catalogQ.trim().toLowerCase();
                if (!s) return true;
                return (t.name + ' ' + t.description + ' ' + t.category).toLowerCase().includes(s);
              })
              .map((t: CatalogTemplate) => {
                const already = items.some(i => i.name === t.name);
                return (
                  <div key={t.slug} className="border rounded-md p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{t.name}</p>
                        <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        {already && <Badge variant="outline" className="text-xs">já existe</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      <pre className="text-[11px] bg-muted rounded p-2 mt-2 max-h-24 overflow-hidden whitespace-pre-wrap">{t.content.slice(0, 220)}{t.content.length > 220 ? '…' : ''}</pre>
                    </div>
                    <Button
                      size="sm"
                      disabled={addingSlug === t.slug}
                      onClick={async () => {
                        setAddingSlug(t.slug);
                        try {
                          await createPrompt({
                            name: t.name,
                            description: t.description,
                            category: t.category,
                            content: t.content,
                          });
                          reload();
                          toast({ title: 'Adicionado', description: t.name });
                        } catch (e: any) {
                          toast({ title: 'Erro', description: e?.message ?? String(e), variant: 'destructive' });
                        } finally {
                          setAddingSlug(null);
                        }
                      }}
                      className="gap-2 shrink-0"
                    >
                      {addingSlug === t.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Adicionar
                    </Button>
                  </div>
                );
              })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCatalogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
