import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BREVO_NOT_CONFIGURED = "BREVO_NOT_CONFIGURED";

async function normalizeBrevoError(error: { message?: string; context?: Response | null }) {
  if (error?.message?.includes("BREVO_API_KEY not configured")) {
    return BREVO_NOT_CONFIGURED;
  }

  const response = error?.context;
  if (response instanceof Response) {
    try {
      const payload = await response.clone().json();
      if (payload?.needsSetup || payload?.error === BREVO_NOT_CONFIGURED || payload?.error === "BREVO_API_KEY not configured") {
        return BREVO_NOT_CONFIGURED;
      }
    } catch {
      try {
        const text = await response.clone().text();
        if (text.includes("BREVO_API_KEY not configured") || text.includes(BREVO_NOT_CONFIGURED)) {
          return BREVO_NOT_CONFIGURED;
        }
      } catch {
        // noop
      }
    }
  }

  return error?.message || "Brevo API error";
}

async function brevoCall(action: string, params: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("brevo-proxy", {
    body: { action, params },
  });
  if (error) throw new Error(await normalizeBrevoError(error));
  if (data?.error) {
    if (data.needsSetup) throw new Error(BREVO_NOT_CONFIGURED);
    throw new Error(data.error);
  }
  return data;
}

// Contacts
export function useBrevoContacts(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["brevo", "contacts", limit, offset],
    queryFn: () => brevoCall("getContacts", { limit, offset }),
    retry: false,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { email: string; attributes?: Record<string, any>; listIds?: number[] }) =>
      brevoCall("createContact", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "contacts"] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { identifier: string; attributes?: Record<string, any>; listIds?: number[] }) =>
      brevoCall("updateContact", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "contacts"] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) => brevoCall("deleteContact", { identifier }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "contacts"] }),
  });
}

// Lists
export function useBrevoLists(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["brevo", "lists", limit, offset],
    queryFn: () => brevoCall("getLists", { limit, offset }),
    retry: false,
  });
}

export function useBrevoListContacts(listId: number | null, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["brevo", "listContacts", listId, limit, offset],
    queryFn: () => brevoCall("getContactsFromList", { listId, limit, offset }),
    enabled: !!listId,
    retry: false,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; folderId?: number }) => brevoCall("createList", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "lists"] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: number) => brevoCall("deleteList", { listId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "lists"] }),
  });
}

export function useAddContactsToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { listId: number; emails: string[] }) => brevoCall("addContactsToList", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo"] }),
  });
}

export function useRemoveContactsFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { listId: number; emails: string[] }) => brevoCall("removeContactsFromList", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo"] }),
  });
}

// Campaigns
export function useBrevoCampaigns(limit = 50, offset = 0, status = "") {
  return useQuery({
    queryKey: ["brevo", "campaigns", limit, offset, status],
    queryFn: () => brevoCall("getCampaigns", { limit, offset, status }),
    retry: false,
  });
}

export function useBrevoCampaign(campaignId: number | null) {
  return useQuery({
    queryKey: ["brevo", "campaign", campaignId],
    queryFn: () => brevoCall("getCampaign", { campaignId }),
    enabled: !!campaignId,
    retry: false,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      subject: string;
      sender: { name: string; email: string };
      htmlContent: string;
      recipients: { listIds: number[] };
      scheduledAt?: string;
    }) => brevoCall("createCampaign", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: number) => brevoCall("deleteCampaign", { campaignId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "campaigns"] }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: number) => brevoCall("sendCampaign", { campaignId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brevo", "campaigns"] }),
  });
}

export function useSendTestCampaign() {
  return useMutation({
    mutationFn: (params: { campaignId: number; emailTo: string[] }) => brevoCall("sendTestCampaign", params),
  });
}

// Dashboard
export function useBrevoAccount() {
  return useQuery({
    queryKey: ["brevo", "account"],
    queryFn: () => brevoCall("getAccountInfo"),
    retry: false,
  });
}

export function useBrevoEmailStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["brevo", "stats", startDate, endDate],
    queryFn: () => brevoCall("getEmailStats", { startDate, endDate }),
    retry: false,
  });
}
