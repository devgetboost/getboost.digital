import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLink: (leadId: string) => Promise<void>;
  initialEmail?: string;
};

export function LeadLinkDialog({ open, onOpenChange, onLink, initialEmail }: Props) {
  const [query, setQuery] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [linking, setLinking] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, phone")
        .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(5);
      if (error) throw error;
      setLeads(data || []);
    } catch (e: any) {
      toast.error("Falha ao procurar leads: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (leadId: string) => {
    setLinking(leadId);
    try {
      await onLink(leadId);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao associar: " + e.message);
    } finally {
      setLinking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Associar a um Lead</DialogTitle>
          <DialogDescription>
            Procura um lead existente no CRM para associar a esta conversa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome ou email..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
            </div>
            <Button onClick={search} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Procurar"}
            </Button>
          </div>

          <div className="space-y-2">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <div 
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={linking !== null}
                    onClick={() => handleLink(lead.id)}
                  >
                    {linking === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Associar"}
                  </Button>
                </div>
              ))
            ) : query && !loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Nenhum lead encontrado.</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
