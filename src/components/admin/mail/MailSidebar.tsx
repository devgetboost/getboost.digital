import { Inbox, Star, Send, FileEdit, Trash2, Clock, PenSquare, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabelManager } from "./LabelManager";
import type { EmailLabel } from "@/hooks/useEmailLabels";

export type MailFolder = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "trash" | "site_chat";

const FOLDERS: { id: MailFolder; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "inbox", title: "Caixa de entrada", icon: Inbox },
  { id: "site_chat", title: "Chat do site", icon: MessageSquare },
  { id: "starred", title: "Estrelado", icon: Star },
  { id: "snoozed", title: "Cochilou", icon: Clock },
  { id: "sent", title: "Enviado", icon: Send },
  { id: "drafts", title: "Rascunhos", icon: FileEdit },
  { id: "trash", title: "Lixo", icon: Trash2 },
];

type Props = {
  folder: MailFolder;
  onFolderChange: (f: MailFolder) => void;
  activeLabelId: string | null;
  onLabelChange: (l: EmailLabel | null) => void;
  onCompose: () => void;
  disabled?: boolean;
};

export function MailSidebar({ folder, onFolderChange, activeLabelId, onLabelChange, onCompose, disabled }: Props) {
  return (
    <aside className="w-56 shrink-0 border-r bg-background flex flex-col">
      <div className="p-3">
        <Button onClick={onCompose} disabled={disabled} className="w-full gap-2 rounded-full">
          <PenSquare className="h-4 w-4" /> Compor
        </Button>
      </div>
      <nav className="px-2 space-y-0.5">
        {FOLDERS.map((f) => {
          const Icon = f.icon;
          const isActive = folder === f.id && !activeLabelId;
          return (
            <button
              key={f.id}
              onClick={() => { onLabelChange(null); onFolderChange(f.id); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{f.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 pt-4 border-t flex-1 overflow-y-auto">
        <LabelManager activeLabelId={activeLabelId} onSelect={onLabelChange} />
      </div>
    </aside>
  );
}
