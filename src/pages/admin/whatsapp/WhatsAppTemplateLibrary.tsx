import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Sparkles, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  TEMPLATE_LIBRARY,
  TEMPLATE_CATEGORIES,
  type TemplatePreset,
} from "./templateLibrary";

interface Props {
  onImport: (preset: TemplatePreset) => void;
}

const TONE_COLOR: Record<TemplatePreset["tone"], string> = {
  formal: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  amigável: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  comercial: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgente: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  "follow-up": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export default function WhatsAppTemplateLibrary({ onImport }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TEMPLATE_LIBRARY.filter((t) => {
      const matchCat = category === "all" || t.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    m.set("all", TEMPLATE_LIBRARY.length);
    for (const t of TEMPLATE_LIBRARY) m.set(t.category, (m.get(t.category) || 0) + 1);
    return m;
  }, []);

  function copyContent(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "Mensagem copiada" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Biblioteca de Modelos</h2>
          <p className="text-sm text-muted-foreground">
            {TEMPLATE_LIBRARY.length} mensagens prontas para importar e personalizar
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Procurar por nome, descrição ou conteúdo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categories */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                category === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {c.label}
              <span className="ml-1.5 opacity-70">({countByCategory.get(c.id) || 0})</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum modelo corresponde à pesquisa.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight">{tpl.name}</h3>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${TONE_COLOR[tpl.tone]}`}>
                      {tpl.tone}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                </div>

                <div className="rounded-lg bg-[#e5ddd5]/60 dark:bg-muted p-2.5 flex-1">
                  <div className="bg-background rounded-md p-2.5 shadow-sm text-xs whitespace-pre-wrap line-clamp-6 font-mono">
                    {tpl.content}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {TEMPLATE_CATEGORIES.find((c) => c.id === tpl.category)?.label}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {tpl.trigger_event}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => copyContent(tpl.content)}
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onImport(tpl)}
                  >
                    <Sparkles className="h-3 w-3" /> Usar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
