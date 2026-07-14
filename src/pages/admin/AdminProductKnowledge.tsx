import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, History, RotateCcw } from "lucide-react";

type Pack = {
  id: string;
  product_slug: string;
  product_name: string;
  pitch: string | null;
  pricing: any;
  faq: any;
  tone: string | null;
  icp: string | null;
  objections: any;
  cases: any;
  extra: any;
  is_active: boolean;
  updated_at: string;
};

type Version = {
  id: string;
  version_number: number;
  product_name: string | null;
  pitch: string | null;
  pricing: any;
  faq: any;
  tone: string | null;
  icp: string | null;
  objections: any;
  cases: any;
  extra: any;
  note: string | null;
  created_at: string;
};

function jsonToText(v: any) {
  try { return JSON.stringify(v ?? null, null, 2); } catch { return ""; }
}
function textToJson(t: string, fallback: any) {
  const s = (t || "").trim();
  if (!s) return fallback;
  return JSON.parse(s);
}

export default function AdminProductKnowledge() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const [form, setForm] = useState<Pack | null>(null);
  const [pricingText, setPricingText] = useState("{}");
  const [faqText, setFaqText] = useState("[]");
  const [objectionsText, setObjectionsText] = useState("[]");
  const [casesText, setCasesText] = useState("[]");
  const [extraText, setExtraText] = useState("{}");

  const selected = useMemo(() => packs.find(p => p.id === selectedId) || null, [packs, selectedId]);

  async function loadPacks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_knowledge")
      .select("*")
      .order("product_slug");
    if (error) toast.error(error.message);
    setPacks((data as any) || []);
    setLoading(false);
    if (!selectedId && data && data.length) setSelectedId((data[0] as any).id);
  }

  useEffect(() => { loadPacks(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!selected) { setForm(null); return; }
    setForm(selected);
    setPricingText(jsonToText(selected.pricing));
    setFaqText(jsonToText(selected.faq));
    setObjectionsText(jsonToText(selected.objections));
    setCasesText(jsonToText(selected.cases));
    setExtraText(jsonToText(selected.extra));
    setShowVersions(false);
  }, [selected]);

  async function loadVersions(pkId: string) {
    const { data, error } = await supabase
      .from("product_knowledge_versions")
      .select("*")
      .eq("product_knowledge_id", pkId)
      .order("version_number", { ascending: false });
    if (error) toast.error(error.message);
    setVersions((data as any) || []);
    setShowVersions(true);
  }

  async function handleSave() {
    if (!form) return;
    let pricing, faq, objections, cases, extra;
    try {
      pricing = textToJson(pricingText, {});
      faq = textToJson(faqText, []);
      objections = textToJson(objectionsText, []);
      cases = textToJson(casesText, []);
      extra = textToJson(extraText, {});
    } catch (e: any) {
      toast.error("JSON inválido: " + e.message);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("product_knowledge")
      .update({
        product_name: form.product_name,
        pitch: form.pitch,
        tone: form.tone,
        icp: form.icp,
        pricing, faq, objections, cases, extra,
        is_active: form.is_active,
      })
      .eq("id", form.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado — nova versão criada");
    await loadPacks();
  }

  async function handleCreate() {
    const slug = prompt("Product slug (ex: novoprod)")?.trim().toLowerCase();
    if (!slug) return;
    const name = prompt("Nome do produto")?.trim() || slug;
    const { data, error } = await supabase
      .from("product_knowledge")
      .insert({ product_slug: slug, product_name: name })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Criado");
    await loadPacks();
    setSelectedId((data as any).id);
  }

  function restoreVersion(v: Version) {
    if (!form) return;
    setForm({ ...form,
      product_name: v.product_name || form.product_name,
      pitch: v.pitch, tone: v.tone, icp: v.icp,
    });
    setPricingText(jsonToText(v.pricing));
    setFaqText(jsonToText(v.faq));
    setObjectionsText(jsonToText(v.objections));
    setCasesText(jsonToText(v.cases));
    setExtraText(jsonToText(v.extra));
    setShowVersions(false);
    toast.info(`Versão v${v.version_number} carregada — clica em Guardar para aplicar`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Knowledge</h1>
          <p className="text-sm text-muted-foreground">Pitch, pricing, FAQ, tom e objeções por produto — injetados no concierge.</p>
        </div>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Novo produto</Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-3">
          <CardHeader><CardTitle className="text-sm">Produtos</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {packs.map(p => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${selectedId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.product_name}</span>
                  {!p.is_active && <Badge variant="secondary" className="text-xs">off</Badge>}
                </div>
                <div className="text-xs opacity-70">{p.product_slug}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="col-span-9 space-y-4">
          {!form ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Seleciona um produto</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{form.product_name} <span className="text-muted-foreground text-sm">/{form.product_slug}</span></CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Última atualização: {new Date(form.updated_at).toLocaleString("pt-PT")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                      <Label className="text-xs">Ativo</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadVersions(form.id)}>
                      <History className="w-4 h-4 mr-2" />Versões
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tom de voz</Label>
                      <Input value={form.tone || ""} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>ICP (cliente-alvo)</Label>
                    <Input value={form.icp || ""} onChange={(e) => setForm({ ...form, icp: e.target.value })} />
                  </div>
                  <div>
                    <Label>Pitch</Label>
                    <Textarea rows={4} value={form.pitch || ""} onChange={(e) => setForm({ ...form, pitch: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Pricing (JSON)</Label>
                      <Textarea rows={6} className="font-mono text-xs" value={pricingText} onChange={(e) => setPricingText(e.target.value)} />
                    </div>
                    <div>
                      <Label>FAQ (JSON array de {`{q,a}`})</Label>
                      <Textarea rows={6} className="font-mono text-xs" value={faqText} onChange={(e) => setFaqText(e.target.value)} />
                    </div>
                    <div>
                      <Label>Objeções (JSON array de {`{objection,response}`})</Label>
                      <Textarea rows={6} className="font-mono text-xs" value={objectionsText} onChange={(e) => setObjectionsText(e.target.value)} />
                    </div>
                    <div>
                      <Label>Casos (JSON array)</Label>
                      <Textarea rows={6} className="font-mono text-xs" value={casesText} onChange={(e) => setCasesText(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Extra (JSON)</Label>
                    <Textarea rows={4} className="font-mono text-xs" value={extraText} onChange={(e) => setExtraText(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {showVersions && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Histórico de versões</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {versions.length === 0 && <p className="text-sm text-muted-foreground">Sem versões ainda.</p>}
                    {versions.map(v => (
                      <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                        <div>
                          <div className="font-medium text-sm">v{v.version_number} — {v.product_name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString("pt-PT")}</div>
                          {v.pitch && <div className="text-xs mt-1 line-clamp-2 max-w-lg">{v.pitch}</div>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => restoreVersion(v)}>
                          <RotateCcw className="w-4 h-4 mr-2" />Carregar
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
