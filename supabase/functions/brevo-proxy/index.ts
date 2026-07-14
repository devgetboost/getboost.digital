import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_BASE_URL = "https://api.brevo.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: hasAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({
          error: "BREVO_NOT_CONFIGURED",
          needsSetup: true,
          configured: false,
          message: "A chave API do Brevo ainda não foi configurada. Configure-a nas definições do projeto.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, params } = body;

    let brevoPath = "";
    let method = "GET";
    let brevoBody: string | undefined;

    switch (action) {
      // Contacts
      case "getContacts":
        brevoPath = `/contacts?limit=${params?.limit || 50}&offset=${params?.offset || 0}${params?.modifiedSince ? `&modifiedSince=${params.modifiedSince}` : ""}`;
        break;
      case "getContact":
        brevoPath = `/contacts/${encodeURIComponent(params.identifier)}`;
        break;
      case "createContact":
        brevoPath = "/contacts";
        method = "POST";
        brevoBody = JSON.stringify({
          email: params.email,
          attributes: params.attributes || {},
          listIds: params.listIds || [],
          updateEnabled: params.updateEnabled ?? true,
        });
        break;
      case "updateContact":
        brevoPath = `/contacts/${encodeURIComponent(params.identifier)}`;
        method = "PUT";
        brevoBody = JSON.stringify({
          attributes: params.attributes || {},
          listIds: params.listIds,
        });
        break;
      case "deleteContact":
        brevoPath = `/contacts/${encodeURIComponent(params.identifier)}`;
        method = "DELETE";
        break;
      case "importContacts":
        brevoPath = "/contacts/import";
        method = "POST";
        brevoBody = JSON.stringify({
          fileBody: params.fileBody,
          listIds: params.listIds || [],
          updateExistingContacts: true,
        });
        break;
      case "exportContacts":
        brevoPath = "/contacts/export";
        method = "POST";
        brevoBody = JSON.stringify({
          exportAttributes: params.exportAttributes || ["EMAIL", "FIRSTNAME", "LASTNAME"],
          contactFilter: params.contactFilter || {},
        });
        break;

      // Lists
      case "getLists":
        brevoPath = `/contacts/lists?limit=${params?.limit || 50}&offset=${params?.offset || 0}`;
        break;
      case "getList":
        brevoPath = `/contacts/lists/${params.listId}`;
        break;
      case "createList":
        brevoPath = "/contacts/lists";
        method = "POST";
        brevoBody = JSON.stringify({ name: params.name, folderId: params.folderId || 1 });
        break;
      case "updateList":
        brevoPath = `/contacts/lists/${params.listId}`;
        method = "PUT";
        brevoBody = JSON.stringify({ name: params.name });
        break;
      case "deleteList":
        brevoPath = `/contacts/lists/${params.listId}`;
        method = "DELETE";
        break;
      case "addContactsToList":
        brevoPath = `/contacts/lists/${params.listId}/contacts/add`;
        method = "POST";
        brevoBody = JSON.stringify({ emails: params.emails });
        break;
      case "removeContactsFromList":
        brevoPath = `/contacts/lists/${params.listId}/contacts/remove`;
        method = "POST";
        brevoBody = JSON.stringify({ emails: params.emails });
        break;
      case "getContactsFromList":
        brevoPath = `/contacts/lists/${params.listId}/contacts?limit=${params?.limit || 50}&offset=${params?.offset || 0}`;
        break;

      // Campaigns
      case "getCampaigns":
        brevoPath = `/emailCampaigns?limit=${params?.limit || 50}&offset=${params?.offset || 0}&status=${params?.status || ""}`;
        break;
      case "getCampaign":
        brevoPath = `/emailCampaigns/${params.campaignId}`;
        break;
      case "createCampaign":
        brevoPath = "/emailCampaigns";
        method = "POST";
        brevoBody = JSON.stringify({
          name: params.name,
          subject: params.subject,
          sender: params.sender,
          htmlContent: params.htmlContent,
          recipients: params.recipients,
          scheduledAt: params.scheduledAt,
        });
        break;
      case "updateCampaign":
        brevoPath = `/emailCampaigns/${params.campaignId}`;
        method = "PUT";
        brevoBody = JSON.stringify({
          name: params.name,
          subject: params.subject,
          htmlContent: params.htmlContent,
          recipients: params.recipients,
          scheduledAt: params.scheduledAt,
        });
        break;
      case "deleteCampaign":
        brevoPath = `/emailCampaigns/${params.campaignId}`;
        method = "DELETE";
        break;
      case "sendCampaign":
        brevoPath = `/emailCampaigns/${params.campaignId}/sendNow`;
        method = "POST";
        break;
      case "sendTestCampaign":
        brevoPath = `/emailCampaigns/${params.campaignId}/sendTest`;
        method = "POST";
        brevoBody = JSON.stringify({ emailTo: params.emailTo });
        break;
      case "getCampaignStats":
        brevoPath = `/emailCampaigns/${params.campaignId}`;
        break;

      // Dashboard / Statistics
      case "getAccountInfo":
        brevoPath = "/account";
        break;
      case "getEmailStats":
        brevoPath = `/smtp/statistics/aggregatedReport?startDate=${params?.startDate || ""}&endDate=${params?.endDate || ""}`;
        break;
      case "getGlobalStats":
        brevoPath = `/smtp/statistics/events?limit=${params?.limit || 50}&offset=${params?.offset || 0}`;
        break;

      // Folders (for list organization)
      case "getFolders":
        brevoPath = `/contacts/folders?limit=${params?.limit || 50}&offset=${params?.offset || 0}`;
        break;

      // Direct transactional email (used by campaigns per-recipient)
      case "sendTransactionalEmail":
        brevoPath = "/smtp/email";
        method = "POST";
        brevoBody = JSON.stringify({
          sender: params.sender, // { name, email }
          to: params.to, // [{ email, name }]
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent,
          replyTo: params.replyTo,
          headers: params.headers,
          tags: params.tags,
        });
        break;


      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const brevoHeaders: Record<string, string> = {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const fetchOptions: RequestInit = {
      method,
      headers: brevoHeaders,
    };
    if (brevoBody) {
      fetchOptions.body = brevoBody;
    }

    const response = await fetch(`${BREVO_BASE_URL}${brevoPath}`, fetchOptions);

    if (method === "DELETE" && response.status === 204) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = response.status === 204 ? { success: true } : await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || "Brevo API error", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Brevo proxy error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
