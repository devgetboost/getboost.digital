import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailLabels, type EmailLabel } from "@/hooks/useEmailLabels";

const PALETTE = ["#ff4000", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

type Props = {
  activeLabelId?: string | null;
  onSelect?: (label: EmailLabel | null) => void;
};

export function LabelManager({ activeLabelId, onSelect }: Props) {
  const { labels, createLabel, deleteLabel, updateLabel } = useEmailLabels();
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!draft.trim()) return;
    await createLabel(draft, color);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Etiquetas</p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-muted-foreground hover:text-foreground rounded p-0.5"
          aria-label="Nova etiqueta"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {adding && (
        <div className="px-3 pb-2 space-y-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Nome da etiqueta"
            className="h-7 text-xs"
          />
          <div className="flex gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                className={`h-4 w-4 rounded-full border ${color === c ? "ring-2 ring-offset-1 ring-foreground/50" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="h-6 text-[11px]" onClick={submit}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => { setAdding(false); setDraft(""); }}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {labels.map((l) => {
          const isActive = activeLabelId === l.id;
          return (
            <div
              key={l.id}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] cursor-pointer transition-colors ${
                isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
              }`}
              onClick={() => onSelect?.(isActive ? null : l)}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: l.color }} />
              <Tag className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate flex-1">{l.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Remover etiqueta "${l.name}"?`)) deleteLabel(l.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label="Remover etiqueta"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {labels.length === 0 && !adding && (
          <p className="px-3 py-2 text-[11px] text-muted-foreground">Sem etiquetas. Cria a primeira com o botão +.</p>
        )}
      </div>
    </div>
  );
}
