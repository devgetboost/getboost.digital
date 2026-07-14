import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Rede =
  | "instagram" | "instagram_stories" | "facebook" | "linkedin"
  | "tiktok" | "youtube" | "youtube_shorts" | "x";

type BaseLimit = { max_chars: number; hashtags_min: number; hashtags_max: number };

// Mirrors defaults in supabase/functions/social-media-agent/index.ts.
const BASE: Record<Rede, BaseLimit> = {
  instagram:         { max_chars: 2200, hashtags_min: 5, hashtags_max: 10 },
  instagram_stories: { max_chars: 200,  hashtags_min: 0, hashtags_max: 3 },
  facebook:          { max_chars: 2000, hashtags_min: 0, hashtags_max: 3 },
  linkedin:          { max_chars: 3000, hashtags_min: 0, hashtags_max: 3 },
  tiktok:            { max_chars: 150,  hashtags_min: 3, hashtags_max: 8 },
  youtube:           { max_chars: 5000, hashtags_min: 0, hashtags_max: 15 },
  youtube_shorts:    { max_chars: 100,  hashtags_min: 1, hashtags_max: 5 },
  x:                 { max_chars: 280,  hashtags_min: 0, hashtags_max: 2 },
};

const REDES = Object.keys(BASE) as Rede[];

type Row = { max_chars: string; hashtags_min: string; hashtags_max: string };
type Rows = Record<Rede, Row>;

const emptyRows = (): Rows =>
  Object.fromEntries(REDES.map(r => [r, { max_chars: "", hashtags_min: "", hashtags_max: "" }])) as Rows;

export default function AdminSocialMediaAuthorLimits() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Rows>(emptyRows());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Rede | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data, error } = await supabase
        .from("social_media_author_limits")
        .select("rede,max_chars,hashtags_min,hashtags_max")
        .eq("user_id", user.id);
      if (error) {
        toast({ title: "Erro a carregar", description: error.message, variant: "destructive" });
      } else {
        const next = emptyRows();
        for (const r of data ?? []) {
          const rede = r.rede as Rede;
          if (!next[rede]) continue;
          next[rede] = {
            max_chars: r.max_chars == null ? "" : String(r.max_chars),
            hashtags_min: r.hashtags_min == null ? "" : String(r.hashtags_min),
            hashtags_max: r.hashtags_max == null ? "" : String(r.hashtags_max),
          };
        }
        setRows(next);
      }
      setLoading(false);
    })();
  }, [toast]);

  const setField = (rede: Rede, key: keyof Row, value: string) => {
    setRows(prev => ({ ...prev, [rede]: { ...prev[rede], [key]: value } }));
  };

  const parseOrNull = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const save = async (rede: Rede) => {
    if (!userId) return;
    const r = rows[rede];
    const payload = {
      user_id: userId,
      rede,
      max_chars: parseOrNull(r.max_chars),
      hashtags_min: parseOrNull(r.hashtags_min),
      hashtags_max: parseOrNull(r.hashtags_max),
    };
    if (payload.max_chars == null && payload.hashtags_min == null && payload.hashtags_max == null) {
      // Nothing set → delete override row.
      setSaving(rede);
      const { error } = await supabase
        .from("social_media_author_limits")
        .delete()
        .eq("user_id", userId).eq("rede", rede);
      setSaving(null);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Limite reposto para o padrão" });
      return;
    }
    setSaving(rede);
    const { error } = await supabase
      .from("social_media_author_limits")
      .upsert(payload, { onConflict: "user_id,rede" });
    setSaving(null);
    if (error) toast({ title: "Erro a guardar", description: error.message, variant: "destructive" });
    else toast({ title: `Limites guardados: ${rede}` });
  };

  const reset = (rede: Rede) =>
    setRows(prev => ({ ...prev, [rede]: { max_chars: "", hashtags_min: "", hashtags_max: "" } }));

  const content = useMemo(() => REDES.map(rede => {
    const b = BASE[rede];
    const r = rows[rede];
    return (
      <Card key={rede}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base capitalize">{rede.replace("_", " ")}</CardTitle>
          <CardDescription className="text-xs">
            Padrão: {b.max_chars} car. · hashtags {b.hashtags_min}–{b.hashtags_max}. Deixa em branco para usar o padrão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Máx. caracteres</Label>
              <Input inputMode="numeric" placeholder={String(b.max_chars)} value={r.max_chars}
                onChange={e => setField(rede, "max_chars", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hashtags mín.</Label>
              <Input inputMode="numeric" placeholder={String(b.hashtags_min)} value={r.hashtags_min}
                onChange={e => setField(rede, "hashtags_min", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hashtags máx.</Label>
              <Input inputMode="numeric" placeholder={String(b.hashtags_max)} value={r.hashtags_max}
                onChange={e => setField(rede, "hashtags_max", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => save(rede)} disabled={saving === rede} className="gap-1">
              {saving === rede ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={() => reset(rede)} className="gap-1">
              <RotateCcw className="h-3 w-3" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }), [rows, saving]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai/social-media-drafts" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar aos rascunhos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-6 w-6" /> Limites de validação por autor
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza os limites de caracteres e hashtags aplicados à validação dos teus posts. Os valores em branco usam o padrão da rede.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
        </div>
      ) : !userId ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Sessão inválida. Entra novamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{content}</div>
      )}
    </div>
  );
}
