import { Headphones, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function SiteChatPanel() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4 bg-background">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Headphones className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-lg font-semibold text-foreground">Chat do Site</h2>
        <p className="text-sm text-muted-foreground">
          As conversas em tempo real do chat do site são geridas no módulo de Atendimento.
        </p>
      </div>
      <Button 
        onClick={() => navigate("/admin/atendimento")}
        className="gap-2"
      >
        <ExternalLink className="h-4 w-4" /> Ir para Atendimento
      </Button>
    </div>
  );
}

export default SiteChatPanel;
