import { useState, useMemo } from "react";
import {
  Star, Search, RefreshCw, Settings, Archive, Trash2, MailOpen, MailWarning,
  UserPlus, MoreHorizontal, X, Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type MailPreview = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread?: boolean;
  starred?: boolean;
  badge?: { label: string; tone: "danger" | "warn" | "info" | "neutral" };
};

export type Assignee = { id: string; name: string };

type Props = {
  items: MailPreview[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  assignees?: Assignee[];
  onArchive?: (ids: string[]) => void | Promise<void>;
  onDelete?: (ids: string[]) => void | Promise<void>;
  onMarkRead?: (ids: string[], read: boolean) => void | Promise<void>;
  onSnooze?: (ids: string[]) => void | Promise<void>;
  onAssign?: (ids: string[], assigneeId: string) => void | Promise<void>;
  onToggleStar?: (id: string, starred: boolean) => void | Promise<void>;
};

const toneMap: Record<NonNullable<MailPreview["badge"]>["tone"], string> = {
  danger: "bg-red-100 text-red-800 border-red-200",
  warn: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function MailList({
  items, selectedId, onSelect, onRefresh, loading, query, onQueryChange,
  assignees, onArchive, onDelete, onMarkRead, onSnooze, onAssign, onToggleStar,
}: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const notImpl = () => toast.info("Ação disponível em breve.");
  const call = (fn: ((...a: any[]) => any) | undefined, ...args: any[]) =>
    fn ? fn(...args) : notImpl();

  const toggleOne = (id: string) => {
    setChecked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const clearChecked = () => setChecked(new Set());
  const allChecked = items.length > 0 && checked.size === items.length;
  const someChecked = checked.size > 0 && !allChecked;
  const selectedIds = useMemo(() => Array.from(checked), [checked]);

  const bulk = async (
    fn: ((ids: string[]) => any) | undefined,
    label: string,
  ) => {
    if (!fn) return notImpl();
    await fn(selectedIds);
    toast.success(`${label} (${selectedIds.length})`);
    clearChecked();
  };

  return (
    <div className="flex-1 min-w-0 border-r flex flex-col bg-background">
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        {checked.size === 0 ? (
          <>
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Pesquisar e-mail"
                className="h-9 pl-8 bg-muted/40 border-transparent focus-visible:bg-background"
              />
            </div>
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading} aria-label="Sincronizar" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="text-xs">Sincronizar</span>
            </Button>
            <Button size="icon" variant="ghost" aria-label="Definições">
              <Settings className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-1 flex-1">
            <Checkbox
              checked={allChecked ? true : someChecked ? "indeterminate" : false}
              onCheckedChange={(v) => {
                if (v) setChecked(new Set(items.map((i) => i.id)));
                else clearChecked();
              }}
              aria-label="Selecionar todos"
            />
            <span className="text-xs text-muted-foreground ml-2 mr-1">{checked.size} selecionado{checked.size > 1 ? "s" : ""}</span>
            <div className="flex items-center gap-0.5 ml-auto">
              <Button size="icon" variant="ghost" title="Arquivar" onClick={() => bulk(onArchive, "Arquivado")}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" title="Eliminar" onClick={() => bulk(onDelete, "Eliminado")}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" title="Marcar como lida"
                onClick={() => onMarkRead ? bulk((ids) => onMarkRead(ids, true), "Marcado como lida") : notImpl()}>
                <MailOpen className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" title="Marcar como não lida"
                onClick={() => onMarkRead ? bulk((ids) => onMarkRead(ids, false), "Marcado como não lida") : notImpl()}>
                <MailWarning className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" title="Adiar" onClick={() => bulk(onSnooze, "Adiado")}>
                <Clock className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" title="Atribuir a">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Atribuir a</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(assignees?.length ?? 0) === 0 && (
                    <DropdownMenuItem disabled>Sem membros disponíveis</DropdownMenuItem>
                  )}
                  {assignees?.map((a) => (
                    <DropdownMenuItem
                      key={a.id}
                      onClick={async () => {
                        if (!onAssign) return notImpl();
                        await onAssign(selectedIds, a.id);
                        toast.success(`Atribuído a ${a.name}`);
                        clearChecked();
                      }}
                    >
                      {a.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="icon" variant="ghost" aria-label="Limpar seleção" onClick={clearChecked}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {items.length === 0 && !loading && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Sem mensagens nesta vista.
          </div>
        )}
        {items.map((m) => {
          const active = selectedId === m.id;
          const isChecked = checked.has(m.id);
          const anyChecked = checked.size > 0;
          return (
            <div
              key={m.id}
              className={`group relative w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${active ? "bg-muted/70" : ""} ${isChecked ? "bg-primary/5" : ""}`}
              onClick={() => onSelect(m.id)}
            >
              {/* Checkbox / Star cluster */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className={`${anyChecked || isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleOne(m.id)}
                    aria-label="Selecionar mensagem"
                  />
                </div>
                <button
                  type="button"
                  aria-label={m.starred ? "Remover estrela" : "Marcar com estrela"}
                  onClick={() => onToggleStar ? onToggleStar(m.id, !m.starred) : notImpl()}
                  className="p-0.5"
                >
                  <Star className={`h-4 w-4 ${m.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                </button>
              </div>

              <div className={`w-40 shrink-0 truncate text-[13px] ${m.unread ? "font-semibold" : ""}`}>{m.from}</div>
              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <span className={`truncate text-[13px] ${m.unread ? "font-semibold" : ""}`}>{m.subject}</span>
                <span className="text-muted-foreground text-[12px] truncate">— {m.snippet}</span>
              </div>
              {m.badge && (
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${toneMap[m.badge.tone]}`}>
                  {m.badge.label}
                </span>
              )}

              {/* Date (hidden on hover to expose actions) */}
              <span className="shrink-0 text-[11px] text-muted-foreground w-16 text-right group-hover:hidden">{m.date}</span>

              {/* Row hover actions */}
              <div
                className="hidden group-hover:flex items-center gap-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Arquivar"
                  onClick={async () => { onArchive ? (await onArchive([m.id]), toast.success("Arquivado")) : notImpl(); }}>
                  <Archive className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Eliminar"
                  onClick={async () => { onDelete ? (await onDelete([m.id]), toast.success("Eliminado")) : notImpl(); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title={m.unread ? "Marcar como lida" : "Marcar como não lida"}
                  onClick={async () => { onMarkRead ? (await onMarkRead([m.id], !!m.unread), toast.success(m.unread ? "Lida" : "Não lida")) : notImpl(); }}>
                  {m.unread ? <MailOpen className="h-4 w-4" /> : <MailWarning className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Adiar"
                  onClick={async () => { onSnooze ? (await onSnooze([m.id]), toast.success("Adiado")) : notImpl(); }}>
                  <Clock className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Mais">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Atribuir a</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(assignees?.length ?? 0) === 0 && (
                      <DropdownMenuItem disabled>Sem membros disponíveis</DropdownMenuItem>
                    )}
                    {assignees?.map((a) => (
                      <DropdownMenuItem
                        key={a.id}
                        onClick={async () => {
                          if (!onAssign) return notImpl();
                          await onAssign([m.id], a.id);
                          toast.success(`Atribuído a ${a.name}`);
                        }}
                      >
                        {a.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
