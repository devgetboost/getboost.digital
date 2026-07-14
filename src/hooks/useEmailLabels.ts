import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EmailLabel = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export function useEmailLabels() {
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabels = useCallback(async () => {
    const { data, error } = await supabase
      .from("email_labels")
      .select("id,name,color,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      toast.error("Erro a carregar etiquetas");
      setLabels([]);
    } else {
      setLabels(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = async (name: string, color = "#ff4000") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      toast.error("Sessão expirada");
      return;
    }
    const { error } = await supabase
      .from("email_labels")
      .insert({ user_id: uid, name: trimmed, color });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Etiqueta criada");
    fetchLabels();
  };

  const updateLabel = async (id: string, patch: Partial<Pick<EmailLabel, "name" | "color" | "sort_order">>) => {
    const { error } = await supabase.from("email_labels").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else fetchLabels();
  };

  const deleteLabel = async (id: string) => {
    const { error } = await supabase.from("email_labels").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Etiqueta removida");
      fetchLabels();
    }
  };

  return { labels, loading, createLabel, updateLabel, deleteLabel, refresh: fetchLabels };
}
