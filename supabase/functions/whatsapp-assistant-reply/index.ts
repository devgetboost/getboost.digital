import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { SITE_KNOWLEDGE } from "../_shared/site-knowledge.ts";
import { logAgentRun } from "../_shared/recordRun.ts";
import { logConciergeCheck, enforceDiscoveryGate, enforceMeetingOfferOnQuoteRequest, detectConciergeLang } from "../_shared/conciergeChecks.ts";
import { samplePhrasing, buildPhrasingPromptSection, detectPhrasingIntent } from "../_shared/conciergePhrasing.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function isInsideBusinessHours(cfg: any): boolean {
  if (!cfg.business_hours_only) return true;
  try {
    const bh = cfg.business_hours || {};
    const tz = bh.tz || "Europe/Lisbon";
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(now);
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const wd = weekdayMap[fmt.find(p => p.type === "weekday")?.value ?? "Mon"];
    const hh = fmt.find(p => p.type === "hour")?.value ?? "00";
    const mm = fmt.find(p => p.type === "minute")?.value ?? "00";
    const now_min = parseInt(hh) * 60 + parseInt(mm);
    const [sh, sm] = String(bh.start || "09:00").split(":").map(Number);
    const [eh, em] = String(bh.end || "19:00").split(":").map(Number);
    const days: number[] = Array.isArray(bh.days) ? bh.days : [1, 2, 3, 4, 5];
    return days.includes(wd) && now_min >= sh * 60 + sm && now_min <= eh * 60 + em;
  } catch {
    return true;
  }
}

// ─── Handoff helpers ──────────────────────────────────────────
import { cannedReplyFor, detectHandoffMatch, detectLang } from "../_shared/whatsappHandoff.ts";


interface CrmHandoffContext {
  source: string;
  motivo: string;
  category?: string | null;
  keyword?: string | null;
  lang?: string | null;
  lastMessage?: string | null;
  lastMessageId?: string | null;
  handoffId?: string | null;
  cannedReply?: string | null;
  instanceId?: string | null;
}

async function notifyCrmHandoff(conv: any, ctx: CrmHandoffContext) {
  const url = Deno.env.get("CRM_WEBHOOK_URL");
  if (!url) {
    console.warn(JSON.stringify({ level: "warn", msg: "crm_webhook_url_missing", conversation_id: conv?.id }));
    return;
  }
  const payload = {
    event: "whatsapp_handoff",
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: ctx.source,
    reason: {
      motivo: ctx.motivo,
      category: ctx.category ?? null,
      keyword: ctx.keyword ?? null,
      lang: ctx.lang ?? null,
    },
    contact: {
      id: conv?.contact_id ?? null,
      lead_id: conv?.lead_id ?? null,
      name: conv?.contact_name ?? null,
      phone: conv?.contact_phone ?? null,
      email: conv?.contact_email ?? null,
    },
    conversation: {
      id: conv?.id ?? null,
      instance_id: ctx.instanceId ?? conv?.instance_id ?? null,
      handoff_to_human: true,
    },
    handoff: {
      id: ctx.handoffId ?? null,
      canned_reply: ctx.cannedReply ?? null,
    },
    last_message: {
      id: ctx.lastMessageId ?? null,
      content: ctx.lastMessage ?? null,
    },
    // top-level aliases for CRMs that index flat fields
    conversation_id: conv?.id ?? null,
    contact_phone: conv?.contact_phone ?? null,
    contact_name: conv?.contact_name ?? null,
    motivo: ctx.motivo,
    last_message_text: ctx.lastMessage ?? null,
  };
  let statusCode: number | null = null;
  let responseBody: string | null = null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Source": "whatsapp-assistant-reply",
        "X-Event-Type": "whatsapp_handoff",
      },
      body: JSON.stringify(payload),
    });
    statusCode = res.status;
    responseBody = await res.text().catch(() => null);
    if (!res.ok) {
      console.error(JSON.stringify({ level: "error", msg: "crm_webhook_non_2xx", status: res.status, body: responseBody, conversation_id: conv?.id }));
    } else {
      console.log(JSON.stringify({ level: "info", msg: "crm_webhook_sent", conversation_id: conv?.id, handoff_id: ctx.handoffId, category: ctx.category }));
    }
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "crm_webhook_failed", error: (e as Error).message, conversation_id: conv?.id }));
  }

  try {
    await supabase.from("crm_handoff_events").insert({
      event_id: (payload as any).event_id,
      handoff_id: ctx.handoffId ?? null,
      conversation_id: conv?.id ?? null,
      contact_phone: conv?.contact_phone ?? null,
      contact_name: conv?.contact_name ?? null,
      category: ctx.category ?? null,
      keyword: ctx.keyword ?? null,
      lang: ctx.lang ?? null,
      motivo: ctx.motivo,
      last_message_id: ctx.lastMessageId ?? null,
      last_message_text: ctx.lastMessage ?? null,
      source: ctx.source,
      status_code: statusCode,
      response_body: responseBody ? responseBody.slice(0, 4000) : null,
      payload,
    });
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "crm_event_persist_failed", error: (e as Error).message }));
  }
}


async function handoffToHuman(conversationId: string, conv: any, motivo: string, source: string, extra: Partial<CrmHandoffContext> = {}) {
  const { data: lastMsg } = await supabase.from("whatsapp_chat_messages")
    .select("id, content").eq("conversation_id", conversationId).eq("sender", "contact")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  let handoffId = extra.handoffId ?? null;
  if (!handoffId) {
    const lang = extra.lang ?? detectLang(String(lastMsg?.content ?? extra.lastMessage ?? ""));
    const { data: handoffRow, error: handoffErr } = await supabase.from("whatsapp_handoffs").insert({
      conversation_id: conversationId,
      contact_phone: conv?.contact_phone,
      contact_name: conv?.contact_name,
      category: extra.category ?? "human_request",
      keyword: extra.keyword ?? null,
      lang,
      trigger_message: lastMsg?.content ?? extra.lastMessage ?? motivo,
      canned_reply: extra.cannedReply ?? null,
      source,
      status: "pending",
      notes: motivo,
    }).select("id").maybeSingle();
    if (handoffErr) {
      console.error(JSON.stringify({ level: "error", msg: "handoff_insert_failed", conversation_id: conversationId, error: handoffErr.message }));
    } else {
      handoffId = (handoffRow as any)?.id ?? null;
    }
  }

  await supabase.from("whatsapp_conversations")
    .update({ handoff_to_human: true }).eq("id", conversationId);

  await notifyCrmHandoff(conv, {
    source,
    motivo,
    ...extra,
    lastMessage: lastMsg?.content ?? extra.lastMessage ?? null,
    lastMessageId: (lastMsg as any)?.id ?? extra.lastMessageId ?? null,
    handoffId,
  });
  console.log(JSON.stringify({ level: "info", msg: "handoff_completed", conversation_id: conversationId, source, motivo, handoff_id: handoffId }));
}



const TOOLS = [
  {
    type: "function",
    function: {
      name: "lookup_cliente",
      description: "Procura um cliente/lead na base de dados por telefone ou email. Retorna dados do lead, serviços contratados e histórico de reuniões.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Telefone (só dígitos, com indicativo)" },
          email: { type: "string", description: "Email do contacto" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "iniciar_orcamento",
      description: "Inicia/atualiza um rascunho de orçamento guiado. Chama esta tool logo que o cliente mostrar interesse em pedir um preço. Vai sendo chamada várias vezes conforme os campos são recolhidos na conversa (nome, email, tipo de serviço, descrição, orçamento, prazo). Retorna quais campos ainda faltam.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          email: { type: "string" },
          servico: { type: "string", description: "web, mobile, saas, marketing, ecommerce, ia, outro" },
          descricao_projecto: { type: "string", description: "O que o cliente precisa em detalhe" },
          orcamento_estimado: { type: "string", description: "Faixa mencionada pelo cliente (ex: 2000-5000€)" },
          prazo: { type: "string", description: "Quando precisa (ex: 1 mês, urgente, sem pressa)" },
          urgencia: { type: "string", enum: ["alta", "media", "baixa"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finalizar_orcamento",
      description: "Fecha o orçamento: gera texto de proposta resumido, cria lead no CRM e marca como pronto para o Nuno rever. Chama SÓ quando todos os campos essenciais estão recolhidos (nome, email OU telefone, serviço, descricao). Retorna o texto da proposta para enviares ao cliente.",
      parameters: {
        type: "object",
        required: ["resumo_proposta"],
        properties: {
          resumo_proposta: { type: "string", description: "Proposta clara e curta (4-8 linhas): entendimento do pedido, âmbito, próximos passos e prazo de resposta." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agendar_reuniao",
      description: "Regista intenção de agendar reunião. Fluxo em 2 passos quando o cliente sugere data+hora: (1) chama primeiro SEM `confirmado` para o cliente confirmar o resumo (dia, hora, timezone); (2) só depois de o cliente confirmar (sim/ok/confirmo/yes/sí), chama outra vez com `confirmado: true` para enviar o convite final.",
      parameters: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string" },
          email: { type: "string" },
          assunto: { type: "string" },
          data_sugerida: { type: "string", description: "YYYY-MM-DD" },
          hora_sugerida: { type: "string", description: "HH:MM (24h)" },
          timezone: { type: "string", description: "IANA timezone; default Europe/Lisbon" },
          confirmado: { type: "boolean", description: "true apenas depois de o cliente confirmar explicitamente o resumo (dia, hora e timezone) na mensagem anterior" },
        },
      },
    },
  },

  {
    type: "function",
    function: {
      name: "reagendar_reuniao",
      description: "Reagenda a próxima reunião do cliente. Fluxo em 2 passos: (1) chama SEM `confirmado` com `nova_data`/`nova_hora` para pedir confirmação do resumo ao cliente; (2) depois de o cliente confirmar (sim/ok/confirmo/yes/sí), chama de novo com `confirmado: true` para actualizar a reserva. Usa o telefone do contacto para encontrar a reserva activa.",
      parameters: {
        type: "object",
        required: ["nova_data", "nova_hora"],
        properties: {
          nova_data: { type: "string", description: "YYYY-MM-DD" },
          nova_hora: { type: "string", description: "HH:MM (24h)" },
          timezone: { type: "string", description: "IANA timezone; default Europe/Lisbon" },
          confirmado: { type: "boolean", description: "true apenas depois do cliente confirmar o novo horário" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelar_reuniao",
      description: "Cancela a próxima reunião do cliente. Fluxo em 2 passos: (1) sem `confirmado` pede confirmação explícita; (2) com `confirmado: true` marca a reserva como cancelada. O sistema envia automaticamente WhatsApp de confirmação de cancelamento.",
      parameters: {
        type: "object",
        properties: {
          motivo: { type: "string", description: "Motivo opcional dado pelo cliente" },
          confirmado: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalar_humano",
      description: "Pausa a IA e notifica o Nuno para assumir a conversa. Usa quando: cliente pede humano, tema muito complexo/sensível, ou reclamação séria.",
      parameters: {
        type: "object",
        required: ["motivo"],
        properties: { motivo: { type: "string" } },
      },
    },
  },
];



const KNOWN_SERVICES = [
  "filmagem", "fotografia", "drone", "video", "vídeo",
  "web", "website", "site", "landing", "saas", "mobile", "app",
  "marketing", "seo", "ads", "google ads", "meta ads", "redes sociais",
  "branding", "logo", "identidade", "copywriting", "conteudo", "conteúdo",
  "crm", "erp", "integracao", "integração", "email marketing", "funil",
];

function validatePhone(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: false, error: "telefone vazio" };
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 9) return { ok: false, error: "telefone com menos de 9 dígitos" };
  if (digits.length > 15) return { ok: false, error: "telefone com mais de 15 dígitos" };
  return { ok: true, normalized: digits };
}

function validateEmail(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: false, error: "email vazio" };
  const v = String(raw).trim().toLowerCase();
  if (v.length > 255) return { ok: false, error: "email demasiado longo" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { ok: false, error: "formato de email inválido" };
  return { ok: true, normalized: v };
}

function validateService(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: false, error: "serviço vazio" };
  const v = String(raw).trim().toLowerCase();
  if (v.length < 3) return { ok: false, error: "serviço demasiado curto" };
  const match = KNOWN_SERVICES.some(s => v.includes(s));
  if (!match) return { ok: false, error: `serviço "${raw}" não reconhecido — pede ao cliente para escolher entre: filmagem, web, marketing, branding, mobile, crm/erp` };
  return { ok: true, normalized: v };
}

function validateFutureDate(raw?: string): { ok: boolean; iso?: string; error?: string } {
  if (!raw) return { ok: false, error: "data vazia" };
  const v = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { ok: false, error: "data deve estar em formato YYYY-MM-DD" };
  const d = new Date(v + "T00:00:00");
  if (isNaN(d.getTime())) return { ok: false, error: "data inválida" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d < today) return { ok: false, error: "data no passado" };
  const max = new Date(today); max.setMonth(max.getMonth() + 6);
  if (d > max) return { ok: false, error: "data a mais de 6 meses" };
  return { ok: true, iso: v };
}

function validateTime(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: true }; // opcional
  const v = String(raw).trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return { ok: false, error: "hora deve estar em formato HH:MM (24h)" };
  return { ok: true, normalized: v };
}

function validationError(field: string, message: string) {
  return JSON.stringify({
    ok: false,
    validation_error: true,
    field,
    error: message,
    ask_user: `Explica ao cliente em português, com simpatia: o ${field} indicado não é válido (${message}). Pede que envie novamente só esse campo, com um exemplo claro.`,
  });
}


function validateName(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: false, error: "nome vazio" };
  const v = String(raw).trim().replace(/\s+/g, " ");
  if (v.length < 2) return { ok: false, error: "nome demasiado curto (mínimo 2 caracteres)" };
  if (v.length > 120) return { ok: false, error: "nome demasiado longo (máximo 120 caracteres)" };
  if (!/[A-Za-zÀ-ÿ]/.test(v)) return { ok: false, error: "nome deve conter letras" };
  return { ok: true, normalized: v };
}

function validateDescription(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: false, error: "descrição vazia" };
  const v = String(raw).trim();
  if (v.length < 15) return { ok: false, error: "descrição demasiado curta (mínimo 15 caracteres — pede objetivo e contexto)" };
  if (v.length > 2000) return { ok: false, error: "descrição demasiado longa (máximo 2000 caracteres)" };
  return { ok: true, normalized: v };
}

function validateTimeline(raw?: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw) return { ok: false, error: "prazo vazio" };
  const v = String(raw).trim();
  if (v.length < 3) return { ok: false, error: "prazo demasiado curto (ex.: '2 semanas', 'até final de agosto')" };
  if (v.length > 120) return { ok: false, error: "prazo demasiado longo" };
  return { ok: true, normalized: v };
}

function needMoreData(needs: string[], reason: string) {
  const labels: Record<string, string> = {
    phone: "telefone (+351 seguido de 9 dígitos)",
    email: "email (formato exemplo@dominio.pt)",
    service: "tipo de serviço (filmagem, web, marketing, branding, mobile, crm/erp)",
    name: "nome completo do cliente (mínimo 2 caracteres)",
    description: "breve descrição do projeto (mínimo 15 caracteres — objetivo e contexto)",
    timeline: "prazo desejado (ex.: '2 semanas', 'até final de agosto')",
  };
  const next = needs[0];
  const pretty = labels[next] || next;
  return JSON.stringify({
    ok: false,
    needs_more_data: true,
    missing: needs,
    next_field: next,
    reason,
    ask_user: `Pergunta APENAS um campo de cada vez, começando por: ${pretty}. Não peças tudo junto. Não chames tools de novo até o cliente responder e o formato estar validado.`,
  });
}

// ─── Rich WhatsApp "cards" (formatted plain text — WA doesn't support real cards) ───
function cardClient(leads: any[], services: any[], bookings: any[]): string {
  const lead = leads[0];
  const lines: string[] = [];
  lines.push(`👤 *${lead.name || "Cliente"}*`);
  if (lead.company) lines.push(`🏢 ${lead.company}`);
  if (lead.email) lines.push(`✉️ ${lead.email}`);
  if (lead.service) lines.push(`🛠️ Serviço: ${lead.service}`);
  if (services?.length) {
    lines.push("", "*Serviços ativos:*");
    for (const s of services.slice(0, 3)) {
      lines.push(`• ${s.service_name} — _${s.status}_${s.price ? ` (${s.price}€)` : ""}`);
    }
  }
  if (bookings?.length) {
    lines.push("", "*Próximas reuniões:*");
    for (const b of bookings.slice(0, 2)) {
      lines.push(`• 📅 ${b.meeting_date} ${b.meeting_time || ""} — ${b.status}`);
    }
  }
  lines.push("", "🔗 Portal do cliente: https://getboost.digital/cliente");
  return lines.join("\n");
}

function cardQuoteDraft(quote: any, missing: string[]): string {
  const l: string[] = ["📝 *Rascunho de orçamento*"];
  if (quote.service_type) l.push(`🛠️ Serviço: ${quote.service_type}`);
  if (quote.project_description) l.push(`📄 ${String(quote.project_description).slice(0, 120)}${quote.project_description.length > 120 ? "…" : ""}`);
  if (quote.budget_range) l.push(`💰 Orçamento: ${quote.budget_range}`);
  if (quote.timeline) l.push(`⏱️ Prazo: ${quote.timeline}`);
  if (missing.length) l.push("", `⏳ Ainda falta: *${missing.join(", ")}*`);
  else l.push("", "✅ Pronto para finalizar.");
  return l.join("\n");
}

// Candidatos de horas por período (24h format)
const MORNING_TIMES = ["09:00", "10:00", "11:00"];
const AFTERNOON_TIMES = ["14:00", "15:00", "16:00", "17:00"];

async function nextTwoBusinessSlots(): Promise<{ dateA: string; dateB: string; labelA: string; labelB: string; timeA: string; timeB: string }> {
  const dayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  // Próximos 10 dias úteis
  const days: { iso: string; label: string; dow: number }[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < 10) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    days.push({ iso: d.toISOString().slice(0, 10), label: dayNames[dow], dow });
  }

  // Carrega bloqueios activos + bookings ocupados
  let blocks: any[] = [];
  let bookings: any[] = [];
  try {
    const [{ data: b1 }, { data: b2 }] = await Promise.all([
      supabase.from("admin_calendar_blocks").select("kind,start_date,end_date,start_time,end_time,weekday,active").eq("active", true),
      supabase.from("bookings").select("meeting_date,meeting_time,status").gte("meeting_date", days[0].iso).lte("meeting_date", days[days.length - 1].iso).neq("status", "cancelled"),
    ]);
    blocks = b1 || [];
    bookings = b2 || [];
  } catch (_e) { /* fallback: sem restrições */ }

  const isBlocked = (iso: string, time: string, dow: number): boolean => {
    // colisão com booking existente
    if (bookings.some((bk) => bk.meeting_date === iso && (bk.meeting_time || "").slice(0, 5) === time)) return true;
    for (const b of blocks) {
      if (b.kind === "day" && b.start_date === iso) return true;
      if (b.kind === "range") {
        const inRange = iso >= b.start_date && iso <= (b.end_date || b.start_date);
        const inTime = (!b.start_time || time >= b.start_time.slice(0, 5)) && (!b.end_time || time < b.end_time.slice(0, 5));
        if (inRange && inTime) return true;
      }
      if (b.kind === "weekly" && b.weekday === dow) {
        const inTime = (!b.start_time || time >= b.start_time.slice(0, 5)) && (!b.end_time || time < b.end_time.slice(0, 5));
        if (inTime) return true;
      }
    }
    return false;
  };

  const pick = (candidates: string[]): { day: typeof days[number]; time: string } | null => {
    for (const day of days) {
      for (const t of candidates) if (!isBlocked(day.iso, t, day.dow)) return { day, time: t };
    }
    return null;
  };

  const morning = pick(MORNING_TIMES);
  // Segundo slot: dia diferente e período diferente
  const afternoon = (() => {
    for (const day of days) {
      if (morning && day.iso === morning.day.iso) continue;
      for (const t of AFTERNOON_TIMES) if (!isBlocked(day.iso, t, day.dow)) return { day, time: t };
    }
    return null;
  })();

  const a = morning || { day: days[0], time: "10:00" };
  const b = afternoon || { day: days[1] || days[0], time: "15:00" };
  return {
    dateA: a.day.iso, labelA: a.day.label, timeA: a.time,
    dateB: b.day.iso, labelB: b.day.label, timeB: b.time,
  };
}

async function cardQuoteReady(leadId: string | undefined, proposal: string): Promise<string> {
  const s = await nextTwoBusinessSlots();
  return [
    "✅ *Proposta registada no CRM*",
    "",
    proposal,
    "",
    `🔗 Detalhes: https://getboost.digital/cliente${leadId ? `?lead=${leadId}` : ""}`,
    "",
    "📅 *Próximo passo — 30 min com o nosso Director Comercial*",
    "Agenda: (1) validação do escopo, (2) prazos e orçamento, (3) próximos passos.",
    "Tenho estes 2 horários (já a excluir bloqueios da agenda):",
    `1️⃣ ${s.labelA} (${s.dateA}) às ${s.timeA}`,
    `2️⃣ ${s.labelB} (${s.dateB}) às ${s.timeB}`,
    "Qual destes te dá mais jeito? 👇",
  ].join("\n");
}



import { BOOKING_URL, cardBooking, shortenUrl, normalizeIanaTz, tzLabel, convertTime, formatTimeLine } from "./booking.ts";
export { BOOKING_URL, cardBooking, shortenUrl };





async function executeTool(name: string, args: any, ctx: { conversationId: string; conv: any; instance?: any }): Promise<string> {
  try {
    if (name === "lookup_cliente") {
      const rawPhone = args.phone || ctx.conv.contact_phone;
      const phoneV = validatePhone(rawPhone);
      const emailV = args.email ? validateEmail(args.email) : { ok: false, error: "sem email" };
      if (!phoneV.ok && !emailV.ok) {
        return needMoreData(["phone"], `identificador inválido — phone: ${phoneV.error}; email: ${emailV.error}`);
      }
      let q = supabase.from("leads").select("id,name,email,phone,company,service,cargo,source,created_at").limit(3);
      if (emailV.ok) q = q.eq("email", emailV.normalized!);
      else q = q.ilike("phone", `%${phoneV.normalized!.slice(-9)}%`);
      const { data: leads } = await q;
      if (!leads?.length) {
        return JSON.stringify({
          found: false,
          message: "Nenhum cliente encontrado no CRM com estes dados. Pergunta ao cliente se já é cliente e confirma email/telefone antes de assumir contexto.",
        });
      }

      const leadIds = leads.map(l => l.id);
      const { data: services } = await supabase.from("client_services")
        .select("service_name,status,price,start_date").in("lead_id", leadIds).limit(5);
      const { data: bookings } = phoneV.ok
        ? await supabase.from("bookings")
            .select("meeting_date,meeting_time,meeting_type,status").ilike("phone", `%${phoneV.normalized!.slice(-9)}%`).limit(3)
        : { data: [] as any[] };
      return JSON.stringify({
        found: true, leads, services: services || [], bookings: bookings || [],
        whatsapp_message: cardClient(leads, services || [], bookings || []),
        instruction: "Envia `whatsapp_message` ao cliente EXATAMENTE como está (mantém emojis, negrito *asterisco* e links), depois pergunta como podes ajudar.",
      });

    }


    if (name === "iniciar_orcamento") {
      // Validate format of any provided fields BEFORE persisting
      if (args.nome) {
        const v = validateName(args.nome);
        if (!v.ok) return validationError("nome", v.error!);
        args.nome = v.normalized;
      }
      if (args.email) {
        const v = validateEmail(args.email);
        if (!v.ok) return validationError("email", v.error!);
        args.email = v.normalized;
      }
      if (args.servico) {
        const v = validateService(args.servico);
        if (!v.ok) return validationError("service", v.error!);
      }
      if (args.descricao_projecto) {
        const v = validateDescription(args.descricao_projecto);
        if (!v.ok) return validationError("description", v.error!);
        args.descricao_projecto = v.normalized;
      }
      if (args.prazo) {
        const v = validateTimeline(args.prazo);
        if (!v.ok) return validationError("timeline", v.error!);
        args.prazo = v.normalized;
      }
      const patch: any = {
        conversation_id: ctx.conversationId,
        contact_phone: ctx.conv.contact_phone,
        contact_name: args.nome ?? ctx.conv.contact_name ?? null,
        contact_email: args.email ?? null,
        service_type: args.servico ?? null,
        project_description: args.descricao_projecto ?? null,
        budget_range: args.orcamento_estimado ?? null,
        timeline: args.prazo ?? null,
        urgency: args.urgencia ?? null,
      };

      const { data: existing } = await supabase.from("whatsapp_quotes")
        .select("id").eq("conversation_id", ctx.conversationId)
        .eq("status", "a_recolher").maybeSingle();
      const cleaned = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== null && v !== undefined));
      let quoteId = existing?.id;
      if (existing) {
        await supabase.from("whatsapp_quotes").update(cleaned).eq("id", existing.id);
      } else {
        const { data: ins } = await supabase.from("whatsapp_quotes").insert(cleaned).select("id").single();
        quoteId = ins?.id;
      }
      const { data: full } = await supabase.from("whatsapp_quotes").select("*").eq("id", quoteId).single();
      // Staged order: email → service → description → timeline → name
      const required = ["contact_email", "service_type", "project_description", "timeline", "contact_name"];

      const missing = required.filter(k => !full?.[k]);
      await supabase.from("whatsapp_quotes").update({ missing_fields: missing }).eq("id", quoteId);
      if (missing.length) {
        const map: Record<string, string> = {
          contact_name: "name",
          contact_email: "email",
          service_type: "service",
          project_description: "description",
          timeline: "timeline",
        };
        return needMoreData(missing.map(m => map[m] || m), "rascunho de orçamento incompleto — falta recolher campos essenciais");
      }
      return JSON.stringify({
        ok: true, quote_id: quoteId, current: full, missing_fields: [],
        whatsapp_message: cardQuoteDraft(full, []),
        next_question: "Todos os campos essenciais recolhidos — chama finalizar_orcamento a seguir.",
        instruction: "Envia `whatsapp_message` ao cliente e confirma que vais preparar a proposta.",
      });

    }

    if (name === "finalizar_orcamento") {
      const { data: quote } = await supabase.from("whatsapp_quotes")
        .select("*").eq("conversation_id", ctx.conversationId)
        .eq("status", "a_recolher").maybeSingle();
      if (!quote) return needMoreData(["service", "description"], "sem rascunho: precisa recolher serviço e descrição via iniciar_orcamento");
      const stillMissing: string[] = [];
      if (!quote.contact_name) stillMissing.push("name");
      if (!quote.contact_email) stillMissing.push("email");
      if (!quote.service_type) stillMissing.push("service");
      if (!quote.project_description) stillMissing.push("description");
      if (!quote.timeline) stillMissing.push("timeline");
      if (stillMissing.length) return needMoreData(stillMissing, "não é possível finalizar orçamento sem nome, email, descrição e prazo");

      if (!args.resumo_proposta || String(args.resumo_proposta).trim().length < 30) {
        return validationError("resumo_proposta", "a proposta deve ter pelo menos 30 caracteres a descrever escopo, entregáveis e prazo");
      }

      // Fetch attachments received during this conversation/quote draft
      const { data: attachments } = await supabase
        .from("whatsapp_quote_attachments")
        .select("id, kind, file_name, file_url, mime_type, caption, created_at")
        .or(`quote_id.eq.${quote.id},conversation_id.eq.${ctx.conversationId}`)
        .order("created_at", { ascending: true });

      const attachmentsBlock = attachments && attachments.length
        ? `\n\n---\nANEXOS (${attachments.length}):\n` + attachments
            .map((a, i) => `${i + 1}. [${a.kind}] ${a.file_name || a.mime_type || "ficheiro"}${a.caption ? ` — "${a.caption}"` : ""}\n   ${a.file_url}`)
            .join("\n")
        : "";

      const { data: lead } = await supabase.from("leads").insert({
        name: quote.contact_name || "Contacto WhatsApp",
        email: quote.contact_email,
        phone: quote.contact_phone,
        service: quote.service_type,
        message: `${quote.project_description || ""}\n\nOrçamento: ${quote.budget_range || "-"}\nPrazo: ${quote.timeline || "-"}\n\n---\nPROPOSTA:\n${args.resumo_proposta}${attachmentsBlock}`,
        source: "whatsapp-orcamento",
      }).select("id").single();

      await supabase.from("whatsapp_quotes").update({
        status: "pronto",
        proposal_text: args.resumo_proposta,
        lead_id: lead?.id ?? null,
      }).eq("id", quote.id);

      // Backfill lead_id on attachments so CRM record links them
      if (lead?.id && attachments?.length) {
        await supabase.from("whatsapp_quote_attachments")
          .update({ lead_id: lead.id, quote_id: quote.id })
          .in("id", attachments.map(a => a.id));
      }

      // Criar tarefa interna para a equipa com link directo ao lead no CRM
      if (lead?.id) {
        const siteUrl = Deno.env.get("SITE_URL") || "https://getboost.digital";
        const leadUrl = `${siteUrl}/admin/leads/${lead.id}`;
        const contactLabel = quote.contact_name || quote.contact_phone || "contacto";
        const serviceLabel = quote.service_type || "serviço não especificado";
        const urgency = /urgente|asap|imediat|ontem/i.test(
          `${quote.timeline || ""} ${quote.project_description || ""}`,
        );
        await supabase.from("admin_tasks").insert({
          title: `📩 Novo orçamento pronto — ${contactLabel}`,
          description:
            `Orçamento recolhido via WhatsApp e pronto para revisão do Nuno.\n\n` +
            `• Cliente: ${contactLabel}\n` +
            `• Telefone: +${quote.contact_phone}\n` +
            `• Email: ${quote.contact_email || "-"}\n` +
            `• Serviço: ${serviceLabel}\n` +
            `• Prazo: ${quote.timeline || "-"}\n` +
            `• Orçamento: ${quote.budget_range || "-"}\n` +
            `• Anexos: ${attachments?.length ?? 0}\n\n` +
            `Proposta gerada:\n${args.resumo_proposta}`,
          link_url: leadUrl,
          task_type: "quote_ready",
          priority: urgency ? "high" : "normal",
          status: "pending",
          lead_id: lead.id,
          quote_id: quote.id,
        });
      }


      // Generate PDF proposal and send it via WhatsApp as a document
      let pdfSent = false;
      let pdfError: string | undefined;
      if (ctx.instance) {
        const pdfRes = await buildAndSendProposalPdf(
          ctx.instance,
          { ...quote, contact_phone: quote.contact_phone || ctx.conv.contact_phone },
          args.resumo_proposta,
          ctx.conversationId,
        );
        pdfSent = pdfRes.ok;
        pdfError = pdfRes.error;
        if (pdfRes.url) {
          await supabase.from("whatsapp_quotes")
            .update({ proposal_pdf_url: pdfRes.url })
            .eq("id", quote.id);
        }
      }

      const quoteMsg = await cardQuoteReady(lead?.id, args.resumo_proposta);
      return JSON.stringify({
        ok: true,
        lead_id: lead?.id,
        attachments_count: attachments?.length ?? 0,
        proposal_pdf_sent: pdfSent,
        proposal_pdf_error: pdfError,
        proposal_to_send: args.resumo_proposta,
        whatsapp_message: quoteMsg
          + (attachments?.length ? `\n\n📎 ${attachments.length} anexo(s) recebido(s) e associado(s) ao pedido.` : "")
          + (pdfSent ? `\n\n📄 Enviei-te agora a proposta em PDF neste chat.` : ""),
        instruction: pdfSent
          ? "O PDF da proposta já foi enviado ao cliente. Envia `whatsapp_message` como texto de acompanhamento (inclui agenda de 30 min + 2 horários já filtrados por bloqueios). Assim que o cliente escolher 1️⃣ ou 2️⃣, chama `agendar_reuniao` com a data ISO e hora correspondentes."
          : "Envia `whatsapp_message` ao cliente EXATAMENTE como está (inclui agenda de 30 min + 2 horários com o Director Comercial já filtrados por bloqueios). Assim que o cliente escolher 1️⃣ ou 2️⃣, chama `agendar_reuniao` com a data ISO e hora correspondentes.",
      });
    }



    if (name === "agendar_reuniao") {
      if (!args.nome || String(args.nome).trim().length < 2) {
        return validationError("nome", "o nome do cliente é obrigatório para agendar");
      }
      if (args.email) {
        const v = validateEmail(args.email);
        if (!v.ok) return validationError("email", v.error!);
        args.email = v.normalized;
      }
      if (args.data_sugerida) {
        const d = validateFutureDate(args.data_sugerida);
        if (!d.ok) return validationError("data_sugerida", d.error!);
      }
      if (args.hora_sugerida) {
        const t = validateTime(args.hora_sugerida);
        if (!t.ok) return validationError("hora_sugerida", t.error!);
      }
      // Validar contra bloqueios de agenda
      if (args.data_sugerida && args.hora_sugerida) {
        try {
          const hhmm = String(args.hora_sugerida).slice(0, 5);
          const { data: blks } = await supabase
            .from("admin_calendar_blocks")
            .select("kind,start_date,end_date,start_time,end_time,weekday,active")
            .eq("active", true);
          const dow = new Date(String(args.data_sugerida) + "T00:00:00").getDay();
          const iso = String(args.data_sugerida);
          const conflict = (blks || []).some((b: any) => {
            if (b.kind === "day") return b.start_date === iso;
            if (b.kind === "range") {
              const inRange = iso >= b.start_date && iso <= (b.end_date || b.start_date);
              const inTime = (!b.start_time || hhmm >= b.start_time.slice(0, 5)) && (!b.end_time || hhmm < b.end_time.slice(0, 5));
              return inRange && inTime;
            }
            if (b.kind === "weekly" && b.weekday === dow) {
              const inTime = (!b.start_time || hhmm >= b.start_time.slice(0, 5)) && (!b.end_time || hhmm < b.end_time.slice(0, 5));
              return inTime;
            }
            return false;
          });
          if (conflict) {
            return needMoreData(["hora_sugerida"], `${iso} às ${hhmm} está bloqueado na agenda do Director. Pede outro horário ao cliente.`);
          }
        } catch (_e) { /* fail-open */ }
      }
      const tzRaw = (args.timezone && String(args.timezone).trim()) || "Europe/Lisbon";
      const tz = normalizeIanaTz(tzRaw);
      const tzName = tzLabel(tz);
      const lisbonEquivalent = args.data_sugerida && args.hora_sugerida && tz !== "Europe/Lisbon"
        ? convertTime(String(args.data_sugerida), String(args.hora_sugerida), tz, "Europe/Lisbon")
        : null;
      const timeLine = args.data_sugerida && args.hora_sugerida
        ? formatTimeLine(String(args.data_sugerida), String(args.hora_sugerida), tz)
        : args.hora_sugerida ? `${args.hora_sugerida} · ${tzName}` : "";
      const suggestedNote = args.data_sugerida
        ? ` O cliente sugeriu ${args.data_sugerida}${timeLine ? " às " + timeLine : ""}.`
        : "";

      // Etapa de confirmação final: quando temos dia+hora e o cliente ainda
      // não confirmou explicitamente o resumo, devolvemos um pedido de
      // confirmação em vez de finalizar o convite.
      if (args.data_sugerida && args.hora_sugerida && args.confirmado !== true) {
        const summary = `${args.data_sugerida} às ${timeLine}`;
        const lisbonLine = lisbonEquivalent
          ? `• Em Lisboa: *${lisbonEquivalent}* (${args.hora_sugerida} ${tzName})\n`
          : "";
        const confirmMsg =
          `Só a confirmar antes de fechar 📅\n` +
          `• Dia: *${args.data_sugerida}*\n` +
          `• Hora: *${args.hora_sugerida}* (${tzName})\n` +
          lisbonLine +
          `\nConfirmas assim, ${args.nome}? (responde *sim* pra eu enviar o convite)`;
        return JSON.stringify({
          ok: true,
          awaiting_confirmation: true,
          summary,
          timezone: tz,
          timezone_label: tzName,
          lisbon_time: lisbonEquivalent,
          whatsapp_message: confirmMsg,
          instruction:
            "Envia `whatsapp_message` ao cliente EXATAMENTE como está e AGUARDA a confirmação explícita (sim/ok/confirmo/yes/sí). " +
            "Só depois de o cliente confirmar, chama `agendar_reuniao` de novo com os MESMOS `data_sugerida`, `hora_sugerida`, `timezone` e adicionando `confirmado: true` para finalizar. " +
            "Se o cliente propuser outro horário, chama a tool com os novos valores (sem `confirmado`) para pedir nova confirmação.",
        });
      }



      // Fallback: verifica se o link de booking está acessível. Se não, sinaliza
      // à IA para recolher dia/hora manualmente e confirmar por mensagem.
      const bookingUrl = BOOKING_URL;
      let bookingAvailable = true;
      try {
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 2500);
        const probe = await fetch(bookingUrl, { method: "HEAD", redirect: "follow", signal: ac.signal });
        clearTimeout(to);
        bookingAvailable = probe.ok;
        if (!bookingAvailable) {
          console.warn(JSON.stringify({ tag: "booking_link_probe_failed", status: probe.status, url: bookingUrl }));
        }
      } catch (e) {
        bookingAvailable = false;
        console.warn(JSON.stringify({ tag: "booking_link_probe_error", error: String(e), url: bookingUrl }));
      }

      if (!bookingAvailable) {
        const hasDate = !!args.data_sugerida;
        const nextQ = hasDate
          ? (args.hora_sugerida
              ? `Perfeito, ${args.nome}! Fico com ${args.data_sugerida} às ${timeLine || args.hora_sugerida}. Confirmo já com o nosso Director Comercial e volto a ti por aqui a confirmar. ✅`
              : `Boa, ${args.nome}! Fico com ${args.data_sugerida}. Que hora te dá mais jeito — manhã (ex: 10h) ou tarde (ex: 15h)?`)
          : `Sem stress, ${args.nome} — o link teve um problema técnico. Podes *responder aqui com o dia e a hora* (ex: _quinta às 15h_) que eu trato do resto. Que dia te dá jeito esta semana?`;
        return JSON.stringify({
          ok: true,
          fallback: true,
          error: "BOOKING_LINK_UNAVAILABLE",
          booking_url: bookingUrl,
          needs_more_data: !hasDate || !args.hora_sugerida,
          next_field: !hasDate ? "data_sugerida" : (!args.hora_sugerida ? "hora_sugerida" : null),
          whatsapp_message: nextQ,
          instruction:
            "O link do booking está indisponível. Envia `whatsapp_message` ao cliente EXATAMENTE como está para recolher dia/hora manualmente por resposta directa. " +
            "Assim que tiveres dia E hora, chama `agendar_reuniao` de novo com `data_sugerida` e `hora_sugerida` para registar a intenção e o Nuno confirmará pessoalmente." +
            suggestedNote,
        });
      }

      return JSON.stringify({
        ok: true,
        booking_url: bookingUrl,
        whatsapp_message: await cardBooking(args.nome, args.data_sugerida, args.hora_sugerida, tz),
        instruction: `Envia \`whatsapp_message\` ao cliente EXATAMENTE como está. Se o cliente disser que o link não abre, aceita que responda com dia e hora directamente por mensagem.${suggestedNote}`,
      });
    }




    if (name === "reagendar_reuniao" || name === "cancelar_reuniao") {
      const phoneDigits = String(ctx.conv.contact_phone || "").replace(/\D/g, "").slice(-9);
      if (!phoneDigits) {
        return validationError("phone", "sem telefone associado à conversa para localizar a reserva");
      }
      const { data: bookings } = await supabase.from("bookings")
        .select("id,name,email,phone,meeting_date,meeting_time,timezone,status,jitsi_room,meeting_link")
        .ilike("phone", `%${phoneDigits}%`)
        .in("status", ["confirmed", "pending", "scheduled"])
        .order("meeting_date", { ascending: true })
        .order("meeting_time", { ascending: true })
        .limit(1);
      const booking = bookings?.[0];
      if (!booking) {
        return JSON.stringify({
          ok: false,
          error: "no_active_booking",
          whatsapp_message:
            `Não encontrei nenhuma reunião activa associada a este número. Se marcaste com outro contacto, diz-me o email que usaste ou marca um horário aqui 👉 ${BOOKING_URL}`,
          instruction: "Envia `whatsapp_message` ao cliente EXATAMENTE como está.",
        });
      }

      const currentSummary = `${booking.meeting_date} às ${booking.meeting_time}`;

      if (name === "cancelar_reuniao") {
        if (args.confirmado !== true) {
          return JSON.stringify({
            ok: true,
            awaiting_confirmation: true,
            whatsapp_message:
              `Só a confirmar antes de cancelar 🙏\n` +
              `• Reunião: *${currentSummary}*\n\n` +
              `Confirmas o cancelamento? (responde *sim* pra eu cancelar)`,
            instruction:
              "Envia `whatsapp_message` ao cliente EXATAMENTE como está e AGUARDA confirmação explícita (sim/ok/confirmo/yes/sí). Só depois chama `cancelar_reuniao` com `confirmado: true`.",
          });
        }
        const { error: upErr } = await supabase.from("bookings")
          .update({ status: "cancelled" }).eq("id", booking.id);
        if (upErr) {
          console.warn(JSON.stringify({ tag: "cancel_booking_failed", error: String(upErr) }));
          return JSON.stringify({ ok: false, error: String(upErr.message || upErr), ask_user: "Tive um problema a cancelar. Podes voltar a confirmar?" });
        }
        return JSON.stringify({
          ok: true,
          cancelled: true,
          booking_id: booking.id,
          whatsapp_message:
            `Prontinho, ${booking.name || ""} ✅ Reunião de *${currentSummary}* cancelada.\n` +
            `Quando quiseres remarcar, é só dizeres o dia/hora ou usar 👉 ${BOOKING_URL}`,
          instruction: "Envia `whatsapp_message` ao cliente EXATAMENTE como está. O sistema envia automaticamente a confirmação de cancelamento por WhatsApp.",
        });
      }

      // reagendar_reuniao
      const nd = validateFutureDate(args.nova_data);
      if (!nd.ok) return validationError("nova_data", nd.error!);
      const nt = validateTime(args.nova_hora);
      if (!nt.ok) return validationError("nova_hora", nt.error!);
      const tzRaw = (args.timezone && String(args.timezone).trim()) || booking.timezone || "Europe/Lisbon";
      const tz = normalizeIanaTz(tzRaw);
      const tzName = tzLabel(tz);
      const timeLine = formatTimeLine(String(args.nova_data), String(args.nova_hora), tz);

      if (args.confirmado !== true) {
        return JSON.stringify({
          ok: true,
          awaiting_confirmation: true,
          booking_id: booking.id,
          whatsapp_message:
            `Só a confirmar o reagendamento 📅\n` +
            `• Antes: *${currentSummary}*\n` +
            `• Novo: *${args.nova_data}* às *${timeLine}*\n\n` +
            `Confirmas? (responde *sim* pra eu actualizar)`,
          instruction:
            "Envia `whatsapp_message` ao cliente EXATAMENTE como está e AGUARDA confirmação explícita. Só depois chama `reagendar_reuniao` com os MESMOS `nova_data`/`nova_hora`/`timezone` e `confirmado: true`.",
        });
      }

      const { error: upErr } = await supabase.from("bookings")
        .update({
          meeting_date: String(args.nova_data),
          meeting_time: String(args.nova_hora),
          timezone: tz,
        })
        .eq("id", booking.id);
      if (upErr) {
        console.warn(JSON.stringify({ tag: "reschedule_booking_failed", error: String(upErr) }));
        return JSON.stringify({ ok: false, error: String(upErr.message || upErr), ask_user: "Tive um problema a reagendar. Podes voltar a confirmar dia e hora?" });
      }
      return JSON.stringify({
        ok: true,
        rescheduled: true,
        booking_id: booking.id,
        whatsapp_message:
          `Feito, ${booking.name || ""} ✅ Reagendei para *${args.nova_data}* às *${timeLine}*.\n` +
          `Recebes email de confirmação e o link Jitsi actualizado por aqui.`,
        instruction: "Envia `whatsapp_message` ao cliente EXATAMENTE como está. O sistema envia automaticamente a confirmação de reagendamento por WhatsApp.",
      });
    }

    if (name === "escalar_humano") {
      await handoffToHuman(ctx.conversationId, ctx.conv, args.motivo || "escalado pela IA", "ai_tool");
      return JSON.stringify({ ok: true, message: "IA pausada. Nuno foi notificado e vai responder pessoalmente." });
    }



    return JSON.stringify({ error: "unknown tool", ask_user: "Desculpa, tive um problema técnico. Podes confirmar novamente o teu pedido?" });
  } catch (e: any) {
    const err = String(e?.message || e).toLowerCase();
    const needs: string[] = [];
    if (err.includes("phone") || err.includes("telefone")) needs.push("phone");
    if (err.includes("email")) needs.push("email");
    if (err.includes("service") || err.includes("servico") || err.includes("serviço")) needs.push("service");
    if (needs.length) return needMoreData(needs, `tool ${name} falhou: ${err}`);
    return JSON.stringify({
      ok: false,
      error: String(e?.message || e),
      ask_user: "Tive um problema a consultar o sistema. Pede ao cliente para confirmar nome, email e o serviço que pretende, e tenta de novo.",
    });
  }
}


async function callLovableAI(
  model: string,
  systemPrompt: string,
  history: any[],
  ctx?: { conversationId: string; conv: any; instance?: any },
  tuning: { temperature?: number | null; maxTokens?: number | null; agentName?: string | null; instanceId?: string | null } = {},
): Promise<string> {
  const messages: any[] = [{ role: "system", content: systemPrompt }, ...history];
  const useTools = !!ctx;
  const startedAt = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  const temperature = Math.max(0, Math.min(2, Number(tuning.temperature ?? 0.4)));
  const maxTokens = Math.max(80, Math.min(2000, Number(tuning.maxTokens ?? 500)));
  const agentName = tuning.agentName || "WhatsApp Concierge";
  const instanceId = tuning.instanceId ?? ctx?.instance?.id ?? ctx?.conv?.instance_id ?? null;


  try {
    for (let step = 0; step < 5; step++) {
      const aiPayload = JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(useTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
      });
      let res: Response | null = null;
      let lastAiError: unknown = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": LOVABLE_API_KEY,
              "X-Lovable-AIG-SDK": "vercel-ai-sdk",
            },
            body: aiPayload,
          }, 25_000);
          if (res.ok || !isTransientStatus(res.status) || attempt === 3) break;
          console.warn(JSON.stringify({ tag: "ai_retry", model, attempt, status: res.status }));
          await res.text().catch(() => "");
        } catch (e) {
          lastAiError = e;
          if (attempt === 3) throw e;
          console.warn(JSON.stringify({ tag: "ai_retry", model, attempt, error: String(e) }));
        }
        await wait(400 * attempt);
      }
      if (!res) throw lastAiError ?? new Error("AI request failed");
      if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text().catch(() => "")}`);
      const data = await res.json();
      if (data?.usage) {
        inputTokens += data.usage.prompt_tokens ?? 0;
        outputTokens += data.usage.completion_tokens ?? 0;
      }
      const msg = data?.choices?.[0]?.message;
      if (!msg) {
        console.log(JSON.stringify({ tag: "assistant_reply_done", instance_id: instanceId, agent_name: agentName, model, status: "empty" }));
        logAgentRun({ agentName, model, startedAt, status: "success", text: "", usage: { inputTokens, outputTokens } });
        return "";
      }

      const toolCalls = msg.tool_calls;
      if (useTools && toolCalls?.length) {
        messages.push(msg);
        for (const tc of toolCalls) {
          const args = (() => { try { return JSON.parse(tc.function.arguments || "{}"); } catch { return {}; } })();
          const startedTool = Date.now();
          console.log(`tool_call: ${tc.function.name}`, args);
          let result = "";
          let errText: string | null = null;
          try {
            result = await executeTool(tc.function.name, args, ctx!);
          } catch (e: any) {
            errText = String(e?.message || e);
            result = JSON.stringify({ ok: false, error: errText });
          }
          const durationMs = Date.now() - startedTool;
          let parsedOut: any = null;
          try { parsedOut = JSON.parse(result); } catch { parsedOut = { raw: result }; }
          const status = errText || parsedOut?.error ? "error"
            : parsedOut?.needs_more_data ? "needs_more_data" : "ok";

          // Fire-and-forget audit log
          (async () => {
            try {
              const phone = (ctx!.conv.contact_phone || "").replace(/\D/g, "");
              let leadId: string | null = null;
              if (phone) {
                const { data: l } = await supabase.from("leads")
                  .select("id").ilike("phone", `%${phone.slice(-9)}%`).limit(1).maybeSingle();
                leadId = l?.id ?? null;
              }
              await supabase.from("whatsapp_tool_call_logs").insert({
                conversation_id: ctx!.conversationId,
                contact_phone: ctx!.conv.contact_phone || null,
                lead_id: leadId,
                tool_name: tc.function.name,
                input: args,
                output: parsedOut,
                status,
                error: errText || parsedOut?.error || null,
                duration_ms: durationMs,
                model,
              });
            } catch (e) {
              console.error("tool_call_log failed:", e);
            }
          })();

          messages.push({ role: "tool", tool_call_id: tc.id, content: result });
        }
        continue;
      }

      const text = (msg.content || "").trim();
      console.log(JSON.stringify({ tag: "assistant_reply_done", instance_id: instanceId, agent_name: agentName, model, status: "success", chars: text.length }));
      logAgentRun({ agentName, model, startedAt, status: "success", text, usage: { inputTokens, outputTokens } });
      return text;
    }
    console.log(JSON.stringify({ tag: "assistant_reply_done", instance_id: instanceId, agent_name: agentName, model, status: "max_steps" }));
    logAgentRun({ agentName, model, startedAt, status: "success", text: "", usage: { inputTokens, outputTokens } });
    return "";
  } catch (err) {
    const e = err as { name?: string; message?: string };
    console.warn(JSON.stringify({ tag: "assistant_reply_done", instance_id: instanceId, agent_name: agentName, model, status: "error", error: e?.message ?? String(err) }));
    logAgentRun({
      agentName, model, startedAt, status: "error",
      errorType: e?.name ?? "Error", errorMessage: e?.message ?? String(err),
      usage: { inputTokens, outputTokens },
    });
    throw err;
  }
}


export async function resolveWhatsAppConciergeConfig(cfg: any, instanceId?: string | null, db: any = supabase) {
  const fallback = {
    model: cfg?.model || "google/gemini-2.5-flash",
    systemPrompt: cfg?.system_prompt || "",
    temperature: 0.4,
    maxTokens: 500,
    source: "whatsapp_assistant_config",
  };

  try {
    let agentId: string | null = null;
    let mappingUsed: "instance_map" | "default_name" | "none" = "none";

    // 1) Preferir mapeamento por instância (whatsapp_instance_agent_map)
    if (instanceId) {
      const { data: mapRow } = await db
        .from("whatsapp_instance_agent_map")
        .select("agent_id")
        .eq("instance_id", instanceId)
        .maybeSingle();
      if (mapRow?.agent_id) {
        agentId = mapRow.agent_id;
        mappingUsed = "instance_map";
      }
    }

    // 2) Fallback: agente global "WhatsApp Concierge"
    let agent: any = null;
    if (agentId) {
      const { data } = await db
        .from("agentic_agents")
        .select("id, name, status, model, system_prompt, temperature, max_tokens, active_version_id")
        .eq("id", agentId)
        .maybeSingle();
      agent = data;
    }
    if (!agent) {
      const { data } = await db
        .from("agentic_agents")
        .select("id, name, status, model, system_prompt, temperature, max_tokens, active_version_id")
        .eq("name", "WhatsApp Concierge")
        .eq("status", "active")
        .maybeSingle();
      agent = data;
      if (agent) mappingUsed = "default_name";
    }

    if (!agent) {
      console.log(JSON.stringify({
        tag: "concierge_agent_resolve",
        instance_id: instanceId ?? null,
        mapping_used: mappingUsed,
        agent_id: null,
        agent_name: null,
        source: fallback.source,
        reason: "no_agent_found_using_config_fallback",
      }));
      return fallback;
    }

    let version: any = null;
    if (agent.active_version_id) {
      const { data } = await db
        .from("agentic_agent_versions")
        .select("id, status, model, system_prompt, temperature, max_tokens")
        .eq("id", agent.active_version_id)
        .eq("status", "approved")
        .maybeSingle();
      version = data;
    }

    const resolved = {
      model: version?.model || agent.model || fallback.model,
      systemPrompt: version?.system_prompt || agent.system_prompt || fallback.systemPrompt,
      temperature: version?.temperature ?? agent.temperature ?? fallback.temperature,
      maxTokens: version?.max_tokens ?? agent.max_tokens ?? fallback.maxTokens,
      source: mappingUsed === "instance_map"
        ? (version ? "instance_map_active_version" : "instance_map_agent")
        : (version ? "agentic_agent_active_version" : "agentic_agent"),
      agentId: agent.id,
      agentName: agent.name,
      versionId: version?.id ?? null,
      mappingUsed,
    };

    console.log(JSON.stringify({
      tag: "concierge_agent_resolve",
      instance_id: instanceId ?? null,
      mapping_used: mappingUsed,
      agent_id: resolved.agentId,
      agent_name: resolved.agentName,
      version_id: resolved.versionId,
      model: resolved.model,
      source: resolved.source,
    }));

    return resolved;
  } catch (e) {
    console.warn(JSON.stringify({
      tag: "concierge_agent_resolve_error",
      instance_id: instanceId ?? null,
      error: (e as Error)?.message ?? String(e),
    }));
    return fallback;
  }
}




// ─── Sync WhatsApp history + summary into the lead's CRM record ───
const WA_CTX_START = "<!-- whatsapp-context:START -->";
const WA_CTX_END = "<!-- whatsapp-context:END -->";

// Chars per token approx (Gemini/PT). Usado para controlar orçamento de input.
const CHARS_PER_TOKEN = 4;
const SUMMARY_INPUT_TOKEN_BUDGET = 1200; // ~4800 chars de transcript
const SUMMARY_OUTPUT_TOKENS = 260;

// Palavras-chave que marcam uma mensagem como "relevante" mesmo fora das últimas 15
const RELEVANCE_RE = /(or[çc]amento|pre[çc]o|prazo|urgente|urg[êe]ncia|reclama|jur[íi]dico|advogad|contrato|assin|proposta|escopo|servi[çc]o|reuni[ãa]o|agend|email|telefone|whatsapp|dead\s*line|budget|quote|price|scope|meeting)/i;

function clampBullets(raw: string): string {
  if (!raw) return "";
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const l of lines) {
    const m = l.match(/^[-•*\d.)\s]+(.*)$/);
    const text = (m?.[1] ?? l).trim();
    if (!text) continue;
    bullets.push(`- ${text.replace(/\s+/g, " ").slice(0, 220)}`);
    if (bullets.length >= 6) break;
  }
  // Se a IA devolveu <4 bullets, mantém o que houver — melhor mostrar pouco do que inventar.
  return bullets.join("\n");
}

async function summarizeConversation(model: string, transcript: string): Promise<string> {
  const maxChars = SUMMARY_INPUT_TOKEN_BUDGET * CHARS_PER_TOKEN;
  const trimmed = transcript.length > maxChars ? transcript.slice(-maxChars) : transcript;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: SUMMARY_OUTPUT_TOKENS,
        messages: [
          {
            role: "system",
            content:
              "És um assistente CRM. Resume a conversa de WhatsApp em português europeu. " +
              "Devolve EXACTAMENTE 4 a 6 bullets começados por '- ' (nunca mais, nunca menos). " +
              "Cobre por esta ordem, quando existir: (1) intenção do cliente, (2) dados fornecidos " +
              "(empresa, serviço, orçamento, prazo), (3) objeções ou dúvidas, (4) decisões tomadas, " +
              "(5) próximos passos combinados, (6) risco/urgência. Cada bullet ≤ 180 chars, sem preâmbulo, sem títulos.",
          },
          { role: "user", content: trimmed },
        ],
      }),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ level: "error", msg: "summary_http_error", status: res.status }));
      return "";
    }
    const data = await res.json();
    return clampBullets((data?.choices?.[0]?.message?.content || "").trim());
  } catch (e) {
    console.error("summarize failed:", e);
    return "";
  }
}


async function syncLeadContext(conv: any, model: string) {
  try {
    const digits = String(conv.contact_phone || "").replace(/\D/g, "");
    if (digits.length < 9) return;

    // Match lead by phone (last 9 digits, tolerant to country-code differences)
    const tail = digits.slice(-9);
    const { data: leadMatches } = await supabase
      .from("leads")
      .select("id, notes, phone, updated_at")
      .ilike("phone", `%${tail}%`)
      .order("updated_at", { ascending: false })
      .limit(1);
    const lead = leadMatches?.[0];
    if (!lead) return;

    const { data: msgs } = await supabase
      .from("whatsapp_chat_messages")
      .select("id, external_id, sender, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (!msgs?.length) return;


    // Persist full history into lead_conversation_messages (idempotent by sent_at).
    try {
      const { data: existing } = await supabase
        .from("lead_conversation_messages")
        .select("sent_at")
        .eq("conversation_id", conv.id);
      const seen = new Set((existing || []).map((r: any) => new Date(r.sent_at).toISOString()));
      const toInsert = msgs
        .filter((m: any) => !seen.has(new Date(m.created_at).toISOString()))
        .map((m: any) => ({
          lead_id: lead.id,
          conversation_id: conv.id,
          contact_phone: conv.contact_phone ?? null,
          direction: m.sender === "contact" ? "inbound" : "outbound",
          sender: m.sender === "contact" ? "user" : (m.sender === "assistant" ? "assistant" : "human"),
          content: String(m.content ?? ""),
          sent_at: m.created_at,
        }));
      if (toInsert.length) {
        await supabase.from("lead_conversation_messages").insert(toInsert);
      }
    } catch (e) {
      console.error("persist lead_conversation_messages failed:", e);
    }

    const LAST_N = 15;
    const RELEVANT_CAP = 10; // no máx. 10 mensagens antigas "relevantes"
    const lastIdx = Math.max(0, msgs.length - LAST_N);
    const older = msgs.slice(0, lastIdx);
    const last = msgs.slice(lastIdx);

    const scored = older
      .map((m, i) => ({
        m, i,
        score:
          (RELEVANCE_RE.test(m.content ?? "") ? 2 : 0) +
          (m.sender === "contact" && (m.content ?? "").length > 80 ? 1 : 0),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.i - a.i)
      .slice(0, RELEVANT_CAP)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.m);

    const fmt = (m: any) => {
      const who = m.sender === "contact" ? "Cliente" : (m.sender === "assistant" ? "IA" : "Nuno");
      const ts = new Date(m.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
      return `[${ts}] ${who}: ${String(m.content).replace(/\s+/g, " ").slice(0, 400)}`;
    };

    const parts: string[] = [];
    if (scored.length) parts.push("== Mensagens anteriores relevantes ==", ...scored.map(fmt));
    parts.push("== Últimas mensagens ==", ...last.map(fmt));
    const transcript = parts.join("\n");

    const summary = await summarizeConversation(model || "google/gemini-2.5-flash", transcript);

    // notes agora guarda apenas o resumo curto — o histórico completo vive em lead_conversation_messages.
    const block = [
      WA_CTX_START,
      `## Resumo WhatsApp (atualizado ${new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })})`,
      `Conversa: ${conv.id}`,
      summary ? `\n${summary}` : "_(sem resumo disponível)_",
      WA_CTX_END,
    ].filter(Boolean).join("\n");

    const existing2 = lead.notes || "";
    const cleaned = existing2.includes(WA_CTX_START) && existing2.includes(WA_CTX_END)
      ? existing2.replace(new RegExp(`${WA_CTX_START}[\\s\\S]*?${WA_CTX_END}`), "").trim()
      : existing2.trim();
    const nextNotes = (cleaned ? cleaned + "\n\n" : "") + block;

    await supabase.from("leads").update({ notes: nextNotes }).eq("id", lead.id);
    console.log(`synced lead context lead=${lead.id} conv=${conv.id}`);

    // ─── Dispara evento CRM: whatsapp_context_updated ─────────────
    try {
      const lastMsg = msgs[msgs.length - 1] as any;
      // versão determinística do resumo (hash curto FNV-1a)
      let h = 0x811c9dc5;
      for (let i = 0; i < summary.length; i++) {
        h ^= summary.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
      }
      const summary_version = h.toString(16).padStart(8, "0");

      const webhookUrl = Deno.env.get("CRM_WEBHOOK_URL");
      const payload = {
        event: "whatsapp_context_updated",
        occurred_at: new Date().toISOString(),
        lead_id: lead.id,
        conversation_id: conv.id,
        contact_phone: conv.contact_phone ?? null,
        summary_version,
        summary_bullet_count: summary.split("\n").filter((l) => l.trim().startsWith("-")).length,
        summary_length: summary.length,
        last_message_id: lastMsg?.id ?? null,
        last_message_external_id: lastMsg?.external_id ?? null,
        last_message_at: lastMsg?.created_at ?? null,
        message_count: msgs.length,
      };

      // Log de auditoria (crm_handoff_events serve como tabela de eventos CRM)
      await supabase.from("crm_handoff_events").insert({
        conversation_id: conv.id,
        contact_phone: conv.contact_phone ?? null,
        source: "whatsapp_context_updated",
        last_message_id: lastMsg?.id ?? null,
        last_message_text: String(lastMsg?.content ?? "").slice(0, 500),
        motivo: `resumo v${summary_version}`,
        payload,
      });

      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((e) => console.error("crm webhook failed:", e));
      }
    } catch (e) {
      console.error("crm context event failed:", e);
    }


  } catch (e) {
    console.error("syncLeadContext failed:", e);
  }
}


async function sendWhatsAppMessage(instance: any, phone: string, text: string) {
  const base = String(instance.server_url).replace(/\/$/, "");
  const body = JSON.stringify({ number: phone, text });
  let lastStatus = 0;
  let lastData: any = null;
  let lastError: string | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetchWithTimeout(`${base}/message/sendText/${instance.instance_name}`, {
        method: "POST",
        headers: { apikey: instance.api_key, "Content-Type": "application/json" },
        body,
      }, 15_000);
      lastStatus = res.status;
      lastData = await res.json().catch(async () => ({ raw: await res.text().catch(() => "") }));
      if (res.ok) return { ok: true, status: res.status, data: lastData };
      if (!isTransientStatus(res.status)) break;
      console.warn(JSON.stringify({ tag: "whatsapp_send_retry", instance_id: instance?.id ?? null, attempt, status: res.status }));
    } catch (e) {
      lastError = String(e);
      console.warn(JSON.stringify({ tag: "whatsapp_send_retry", instance_id: instance?.id ?? null, attempt, error: lastError }));
    }
    await wait(500 * attempt);
  }
  return { ok: false, status: lastStatus, data: lastData ?? { error: lastError } };
}

function fallbackReplyFor(lastUserMessage: string): string {
  const lang = detectConciergeLang(lastUserMessage || "");
  if (lang === "en") {
    return "I received your message, but I had a brief technical hiccup. Can you send me one more detail about what you need, so I can help you properly?";
  }
  if (lang === "es") {
    return "He recibido tu mensaje, pero tuve un pequeño fallo técnico. ¿Me envías un detalle más de lo que necesitas para ayudarte bien?";
  }
  return "Recebi a tua mensagem, mas tive uma falha técnica momentânea. Podes enviar-me só mais um detalhe do que precisas para eu te ajudar bem?";
}

async function sendTypingPresence(instance: any, phone: string, durationMs = 8000) {
  try {
    const base = String(instance.server_url).replace(/\/$/, "");
    await fetch(`${base}/chat/sendPresence/${instance.instance_name}`, {
      method: "POST",
      headers: { apikey: instance.api_key, "Content-Type": "application/json" },
      body: JSON.stringify({ number: phone, delay: durationMs, presence: "composing" }),
    });
  } catch (e) {
    console.warn("sendTypingPresence failed", e);
  }
}

// Split an AI reply into progressive WhatsApp chunks.
// Strategy: split by blank lines (paragraphs); for paragraphs longer than ~350 chars,
// further split by sentence terminators. Merge tiny fragments so we don't spam.
// Máximo absoluto de blocos por resposta (evita flood no WhatsApp)
const MAX_CHUNKS_PER_REPLY = 5;
// Intervalo mínimo entre respostas consecutivas da IA na mesma conversa (ms)
const MIN_REPLY_INTERVAL_MS = 3000;
// Se uma conversa ficou marcada como handoff sem registo activo, a IA deve
// recuperar automaticamente em vez de ficar silenciosa para sempre.
const STALE_HANDOFF_HOURS = 12;

type ChunkStrategy = "paragraph" | "sentence" | "char" | "none";

function splitReplyIntoChunks(
  text: string,
  opts: { strategy?: ChunkStrategy; maxLen?: number; minLen?: number; maxChunks?: number } = {},
): string[] {
  const strategy: ChunkStrategy = opts.strategy ?? "paragraph";
  const maxLen = opts.maxLen ?? 350;
  const minLen = opts.minLen ?? 40;
  const maxChunks = opts.maxChunks ?? MAX_CHUNKS_PER_REPLY;

  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (strategy === "none") return [clean];

  let out: string[] = [];

  if (strategy === "char") {
    for (let i = 0; i < clean.length; i += maxLen) {
      out.push(clean.slice(i, i + maxLen).trim());
    }
  } else if (strategy === "sentence") {
    const sentences = clean.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g) ?? [clean];
    let buf = "";
    for (const s of sentences) {
      const seg = s.trim();
      if (!seg) continue;
      if ((buf + " " + seg).trim().length > maxLen && buf) {
        out.push(buf.trim()); buf = seg;
      } else {
        buf = (buf ? buf + " " : "") + seg;
      }
    }
    if (buf.trim()) out.push(buf.trim());
  } else {
    // paragraph (default) — split by blank lines; long paragraphs split by sentence
    const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    for (const p of paragraphs) {
      if (p.length <= maxLen) { out.push(p); continue; }
      const sentences = p.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g) ?? [p];
      let buf = "";
      for (const s of sentences) {
        const seg = s.trim();
        if (!seg) continue;
        if ((buf + " " + seg).trim().length > maxLen && buf) {
          out.push(buf.trim()); buf = seg;
        } else {
          buf = (buf ? buf + " " : "") + seg;
        }
      }
      if (buf.trim()) out.push(buf.trim());
    }
  }

  // Merge fragments demasiado pequenos no bloco anterior
  const merged: string[] = [];
  for (const c of out.filter(Boolean)) {
    if (merged.length && c.length < minLen) {
      merged[merged.length - 1] += (strategy === "paragraph" ? "\n\n" : " ") + c;
    } else {
      merged.push(c);
    }
  }
  // Cap total de blocos: junta o excedente no último bloco
  if (merged.length > maxChunks) {
    const head = merged.slice(0, maxChunks - 1);
    const tail = merged.slice(maxChunks - 1).join(strategy === "paragraph" ? "\n\n" : " ");
    return [...head, tail];
  }
  return merged;
}

async function sendWhatsAppDocument(
  instance: any,
  phone: string,
  mediaUrl: string,
  fileName: string,
  caption: string,
) {
  const base = String(instance.server_url).replace(/\/$/, "");
  const res = await fetch(`${base}/message/sendMedia/${instance.instance_name}`, {
    method: "POST",
    headers: { apikey: instance.api_key, "Content-Type": "application/json" },
    body: JSON.stringify({
      number: phone,
      mediatype: "document",
      mimetype: "application/pdf",
      media: mediaUrl,
      fileName,
      caption,
    }),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function generateProposalPdf(input: {
  quoteId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  serviceType: string;
  projectDescription: string;
  timeline: string;
  budgetRange: string | null;
  proposalText: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const orange = rgb(1, 0.251, 0);
  const dark = rgb(0.05, 0.05, 0.05);
  const grey = rgb(0.35, 0.35, 0.35);

  const marginX = 50;
  const pageW = 595; // A4
  const pageH = 842;
  let page = doc.addPage([pageW, pageH]);
  let y = pageH - 60;

  const wrap = (text: string, size: number, f = font, maxW = pageW - marginX * 2): string[] => {
    const words = String(text || "").replace(/\r/g, "").split(/(\s+)/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if (w === "\n") { lines.push(cur); cur = ""; continue; }
      const test = cur + w;
      if (f.widthOfTextAtSize(test, size) > maxW) {
        if (cur) lines.push(cur.trimEnd());
        cur = w.trimStart();
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.flatMap(l => l.split("\n"));
  };

  const draw = (text: string, size: number, f = font, color = dark) => {
    for (const line of wrap(text, size, f)) {
      if (y < 60) { page = doc.addPage([pageW, pageH]); y = pageH - 60; }
      page.drawText(line, { x: marginX, y, size, font: f, color });
      y -= size + 4;
    }
  };

  // Header bar
  page.drawRectangle({ x: 0, y: pageH - 40, width: pageW, height: 40, color: orange });
  page.drawText("Getboost — Proposta", {
    x: marginX, y: pageH - 27, size: 16, font: bold, color: rgb(1, 1, 1),
  });

  y = pageH - 80;
  draw(`Ref: ${input.quoteId.slice(0, 8).toUpperCase()}`, 9, font, grey);
  draw(new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }), 9, font, grey);
  y -= 10;

  draw("Cliente", 12, bold, orange);
  draw(input.contactName, 11);
  draw(input.contactEmail, 10, font, grey);
  draw(`+${input.contactPhone}`, 10, font, grey);
  y -= 10;

  draw("Serviço", 12, bold, orange);
  draw(input.serviceType, 11);
  y -= 6;

  draw("Descrição do projecto", 12, bold, orange);
  draw(input.projectDescription, 10);
  y -= 6;

  draw("Prazo", 12, bold, orange);
  draw(input.timeline, 10);
  if (input.budgetRange) {
    y -= 6;
    draw("Orçamento indicativo", 12, bold, orange);
    draw(input.budgetRange, 10);
  }
  y -= 10;

  draw("Proposta", 12, bold, orange);
  draw(input.proposalText, 10);
  y -= 20;

  draw("O Nuno confirma pessoalmente em até 24h.", 9, font, grey);
  draw("Getboost · getboost.digital · +351 963 574 400", 9, font, grey);

  return await doc.save();
}

async function buildAndSendProposalPdf(
  instance: any,
  quote: any,
  proposalText: string,
  conversationId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const bytes = await generateProposalPdf({
      quoteId: quote.id,
      contactName: quote.contact_name || "Cliente",
      contactEmail: quote.contact_email || "",
      contactPhone: quote.contact_phone || instance?.contact_phone || "",
      serviceType: quote.service_type || "-",
      projectDescription: quote.project_description || "-",
      timeline: quote.timeline || "-",
      budgetRange: quote.budget_range || null,
      proposalText,
    });

    const path = `proposals/${quote.id}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("whatsapp-media")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };

    const { data: signed, error: signErr } = await supabase.storage
      .from("whatsapp-media")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signErr || !signed?.signedUrl) return { ok: false, error: `sign: ${signErr?.message}` };

    const fileName = `proposta-getboost-${quote.id.slice(0, 8)}.pdf`;
    const caption = "📄 Aqui está a tua proposta em PDF. O Nuno confirma em 24h.";
    const sent = await sendWhatsAppDocument(instance, quote.contact_phone, signed.signedUrl, fileName, caption);

    await supabase.from("whatsapp_chat_messages").insert({
      conversation_id: conversationId,
      external_id: sent.data?.key?.id || null,
      direction: "outbound",
      sender: "assistant",
      content: `[PDF] ${fileName} — ${caption}`,
      status: sent.ok ? "sent" : "failed",
    });

    return { ok: sent.ok, url: signed.signedUrl };
  } catch (e: any) {
    console.error("proposal pdf error:", e);
    return { ok: false, error: String(e?.message || e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string | undefined = body.conversation_id;
    const testPrompt: string | undefined = body.test_prompt;
    const previewLeadId: string | undefined = body.preview_lead_id;
    const previewConvId: string | undefined = body.preview_conversation_id;
    const saveSummaryLeadId: string | undefined = body.save_summary_lead_id;
    const saveSummaryText: string | undefined = body.save_summary;
    const saveSummaryConvId: string | undefined = body.save_summary_conversation_id;

    // ─── Save reviewed summary (admin-only) ───────────────────────
    if (saveSummaryLeadId && typeof saveSummaryText === "string") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: roles } = await supabase.from("user_roles")
        .select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) return json({ error: "Forbidden" }, 403);

      const trimmed = saveSummaryText.trim();
      const bulletCount = trimmed.split("\n").filter((l) => l.trim().startsWith("-")).length;
      if (bulletCount < 4 || bulletCount > 6) {
        return json({ error: `Resumo tem ${bulletCount} bullets — obrigatório 4 a 6.` }, 400);
      }

      const { data: lead } = await supabase.from("leads").select("id, notes").eq("id", saveSummaryLeadId).maybeSingle();
      if (!lead) return json({ error: "Lead não encontrado" }, 404);

      const header = `## Resumo WhatsApp (revisto por ${user.email || user.id} em ${new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })})`;
      const block = [
        WA_CTX_START,
        header,
        saveSummaryConvId ? `Conversa: ${saveSummaryConvId}` : null,
        `\n${trimmed}`,
        WA_CTX_END,
      ].filter(Boolean).join("\n");

      const existing = lead.notes || "";
      const cleaned = existing.includes(WA_CTX_START) && existing.includes(WA_CTX_END)
        ? existing.replace(new RegExp(`${WA_CTX_START}[\\s\\S]*?${WA_CTX_END}`), "").trim()
        : existing.trim();
      const nextNotes = (cleaned ? cleaned + "\n\n" : "") + block;

      const { error: upErr } = await supabase.from("leads").update({ notes: nextNotes }).eq("id", saveSummaryLeadId);
      if (upErr) return json({ error: upErr.message }, 500);
      return json({ ok: true, bullet_count: bulletCount });
    }


    // ─── Test mode (called from admin UI) ─────────────────────────
    if (testPrompt) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: roles } = await supabase.from("user_roles")
        .select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) return json({ error: "Forbidden" }, 403);

      const { data: cfg } = await supabase.from("whatsapp_assistant_config").select("*").eq("id", 1).maybeSingle();
      const concierge = await resolveWhatsAppConciergeConfig(cfg);
      const systemPrompt = `${concierge.systemPrompt || ""}\n\n## Conhecimento do site\n${SITE_KNOWLEDGE}`;
      const reply = await callLovableAI(concierge.model, systemPrompt, [
        { role: "user", content: testPrompt },
      ], undefined, { temperature: concierge.temperature, maxTokens: concierge.maxTokens });
      return json({ reply });
    }

    // ─── Preview summary mode (admin-only, no persistence) ────────
    if (previewLeadId || previewConvId) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: roles } = await supabase.from("user_roles")
        .select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) return json({ error: "Forbidden" }, 403);

      let convId = previewConvId;
      if (!convId && previewLeadId) {
        const { data: lead } = await supabase.from("leads").select("phone").eq("id", previewLeadId).maybeSingle();
        const digits = String(lead?.phone || "").replace(/\D/g, "");
        if (digits.length < 9) return json({ error: "Lead sem telefone válido" }, 400);
        const tail = digits.slice(-9);
        const { data: convs } = await supabase
          .from("whatsapp_conversations")
          .select("id, updated_at")
          .ilike("contact_phone", `%${tail}%`)
          .order("updated_at", { ascending: false })
          .limit(1);
        convId = convs?.[0]?.id;
        if (!convId) return json({ error: "Sem conversa WhatsApp para este lead" }, 404);
      }

      const { data: msgs } = await supabase
        .from("whatsapp_chat_messages")
        .select("sender, content, created_at")
        .eq("conversation_id", convId!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!msgs?.length) return json({ error: "Sem mensagens" }, 404);

      const LAST_N = 15, RELEVANT_CAP = 10;
      const lastIdx = Math.max(0, msgs.length - LAST_N);
      const older = msgs.slice(0, lastIdx);
      const last = msgs.slice(lastIdx);
      const scored = older
        .map((m: any, i: number) => ({
          m, i,
          score: (RELEVANCE_RE.test(m.content ?? "") ? 2 : 0) +
                 (m.sender === "contact" && (m.content ?? "").length > 80 ? 1 : 0),
        }))
        .filter((x: any) => x.score > 0)
        .sort((a: any, b: any) => b.score - a.score || b.i - a.i)
        .slice(0, RELEVANT_CAP)
        .sort((a: any, b: any) => a.i - b.i)
        .map((x: any) => x.m);

      const fmt = (m: any) => {
        const who = m.sender === "contact" ? "Cliente" : (m.sender === "assistant" ? "IA" : "Nuno");
        const ts = new Date(m.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
        return `[${ts}] ${who}: ${String(m.content).replace(/\s+/g, " ").slice(0, 400)}`;
      };
      const parts: string[] = [];
      if (scored.length) parts.push("== Mensagens anteriores relevantes ==", ...scored.map(fmt));
      parts.push("== Últimas mensagens ==", ...last.map(fmt));
      const transcript = parts.join("\n");

      const { data: cfg } = await supabase.from("whatsapp_assistant_config").select("model").eq("id", 1).maybeSingle();
      const summary = await summarizeConversation(cfg?.model || "google/gemini-2.5-flash", transcript);
      const bullet_count = summary.split("\n").filter((l) => l.trim().startsWith("-")).length;
      return json({
        summary,
        conversation_id: convId,
        message_count: msgs.length,
        bullet_count,
        transcript_preview: transcript.slice(0, 1500),
      });
    }

    if (!conversationId) return json({ error: "conversation_id required" }, 400);

    // Normal mode requires service-role auth (webhook calls it server-side).
    // Also accept an admin JWT so admins can manually re-trigger replies from the UI.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    let allowed = token !== "" && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!allowed && token) {
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const { data: roles } = await supabase
            .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
          if (roles && roles.length > 0) allowed = true;
        }
      } catch (_) { /* ignore */ }
    }
    if (!allowed) {
      return json({ error: "Forbidden" }, 403);
    }



    const { data: conv } = await supabase
      .from("whatsapp_conversations").select("*").eq("id", conversationId).maybeSingle();
    if (!conv) { console.warn(JSON.stringify({ tag: "reply_skip", reason: "conversation_not_found", conversationId })); return json({ error: "conversation not found" }, 404); }

    if (!conv.assistant_enabled) {
      console.warn(JSON.stringify({ tag: "reply_skip", reason: "assistant_disabled", conversationId, assistant_enabled: conv.assistant_enabled }));
      return json({ skipped: "assistant disabled" });
    }

    if (conv.handoff_to_human) {
      const { data: activeHandoff } = await supabase
        .from("whatsapp_handoffs")
        .select("id, status, created_at, updated_at")
        .eq("conversation_id", conversationId)
        .in("status", ["pending", "in_review"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const handoffAgeMs = activeHandoff?.created_at
        ? Date.now() - new Date(activeHandoff.created_at).getTime()
        : null;
      const isStaleHandoff = typeof handoffAgeMs === "number" && handoffAgeMs > STALE_HANDOFF_HOURS * 3600_000;

      if (activeHandoff && !isStaleHandoff) {
        console.warn(JSON.stringify({
          tag: "reply_skip",
          reason: "active_handoff",
          conversationId,
          assistant_enabled: conv.assistant_enabled,
          handoff_to_human: conv.handoff_to_human,
          handoff_id: activeHandoff.id,
          handoff_status: activeHandoff.status,
        }));
        return json({ skipped: "active handoff", handoff_id: activeHandoff.id, handoff_status: activeHandoff.status });
      }

      await supabase.from("whatsapp_conversations")
        .update({ handoff_to_human: false, assistant_enabled: true })
        .eq("id", conversationId);
      conv.handoff_to_human = false;
      conv.assistant_enabled = true;
      console.warn(JSON.stringify({
        tag: "handoff_auto_recovered",
        conversationId,
        reason: activeHandoff ? "stale_active_handoff" : "orphan_handoff_flag",
        handoff_id: activeHandoff?.id ?? null,
        handoff_age_ms: handoffAgeMs,
      }));
    }

    const { data: cfg } = await supabase
      .from("whatsapp_assistant_config").select("*").eq("id", 1).maybeSingle();
    if (!cfg?.enabled) { console.warn(JSON.stringify({ tag: "reply_skip", reason: "global_disabled", conversationId })); return json({ skipped: "global disabled" }); }

    const { data: instance } = await supabase
      .from("whatsapp_instances").select("*").eq("id", conv.instance_id).maybeSingle();
    if (!instance || instance.status !== "online") {
      console.warn(JSON.stringify({ tag: "reply_skip", reason: "instance_offline", conversationId, instance_status: instance?.status ?? null, instance_id: conv.instance_id }));
      return json({ skipped: "instance offline" });
    }

    // Rate limit: count assistant outbound msgs in last hour for this conversation
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase.from("whatsapp_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender", "assistant")
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= (cfg.max_replies_per_hour || 20)) {
      console.warn(JSON.stringify({ tag: "reply_skip", reason: "rate_limited", conversationId, count, limit: cfg.max_replies_per_hour || 20 }));
      return json({ skipped: "rate limited" });
    }

    // Rate limit curto: mínimo MIN_REPLY_INTERVAL_MS entre respostas da IA
    const { data: lastOut } = await supabase.from("whatsapp_chat_messages")
      .select("created_at")
      .eq("conversation_id", conversationId)
      .eq("sender", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastOut?.created_at) {
      const elapsed = Date.now() - new Date(lastOut.created_at).getTime();
      if (elapsed < MIN_REPLY_INTERVAL_MS) {
        console.warn(JSON.stringify({ tag: "reply_skip", reason: "min_interval", conversationId, elapsed_ms: elapsed, min_ms: MIN_REPLY_INTERVAL_MS }));
        return json({ skipped: "min interval between replies not met", elapsed });
      }
    }

    // Outside business hours → send offline message once per hour
    if (!isInsideBusinessHours(cfg)) {
      const { data: recentOffline } = await supabase.from("whatsapp_chat_messages")
        .select("id").eq("conversation_id", conversationId)
        .eq("sender", "assistant").gte("created_at", oneHourAgo).limit(1);
      if (recentOffline && recentOffline.length > 0) {
        console.warn(JSON.stringify({ tag: "reply_skip", reason: "offline_already_sent", conversationId }));
        return json({ skipped: "already sent offline msg this hour" });
      }
      const sendRes = await sendWhatsAppMessage(instance, conv.contact_phone, cfg.offline_message);
      if (sendRes.ok) {
        await supabase.from("whatsapp_chat_messages").insert({
          conversation_id: conversationId,
          external_id: sendRes.data?.key?.id || null,
          direction: "outbound", sender: "assistant",
          content: cfg.offline_message, status: "sent",
        });
      }
      console.log(JSON.stringify({ tag: "reply_offline_sent", conversationId, ok: sendRes.ok }));
      return json({ offline_sent: sendRes.ok });
    }

    // Load the latest 20 messages of the conversation. Fetch newest first so
    // PostgREST limits to the real latest rows, then reverse back to chat order.
    const { data: latestHistory } = await supabase.from("whatsapp_chat_messages")
      .select("sender, content, direction, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);
    const history = [...(latestHistory || [])].reverse();

    // ─── Loop guard: se a última mensagem NÃO é do contacto, já respondemos ───
    // (evita a IA responder às próprias mensagens ou entrar em ciclos)
    const lastMsg = (history || []).at(-1);
    if (!lastMsg || lastMsg.sender !== "contact" || lastMsg.direction !== "inbound") {
      console.warn(JSON.stringify({ tag: "reply_skip", reason: "loop_guard", conversationId, last_sender: lastMsg?.sender ?? null, last_direction: lastMsg?.direction ?? null, last_created_at: lastMsg?.created_at ?? null }));
      return json({ skipped: "last message is not from contact — loop guard" });
    }

    // Show "typing…" in the contact's WhatsApp while we generate the reply
    sendTypingPresence(instance, conv.contact_phone, 10000);

    const aiHistory = (history || []).map(m => ({
      role: m.sender === "contact" ? "user" : "assistant",
      content: m.content,
    }));

    // ─── Pré-check: escalonamento por keywords na última msg do contacto ───
    const lastInbound = [...(history || [])].reverse().find(m => m.sender === "contact");
    const match = lastInbound ? detectHandoffMatch(lastInbound.content) : null;
    if (match) {
      const lang = detectLang(lastInbound!.content);
      const canned = cannedReplyFor(match.category, lang);
      const sendRes = await sendWhatsAppMessage(instance, conv.contact_phone, canned);
      await supabase.from("whatsapp_chat_messages").insert({
        conversation_id: conversationId,
        external_id: sendRes.data?.key?.id || null,
        direction: "outbound", sender: "assistant",
        content: canned, status: sendRes.ok ? "sent" : "failed",
      });
      // Registar handoff para revisão interna (primeiro, para obter o id)
      const { data: handoffRow } = await supabase.from("whatsapp_handoffs").insert({
        conversation_id: conversationId,
        contact_phone: conv.contact_phone,
        contact_name: conv.contact_name,
        category: match.category,
        keyword: match.keyword,
        lang,
        trigger_message: lastInbound!.content,
        canned_reply: canned,
        source: "keyword_detect",
        status: "pending",
      }).select("id").maybeSingle();

      await handoffToHuman(
        conversationId,
        { ...conv, id: conversationId },
        `${match.category}: "${match.keyword}"`,
        "keyword_detect",
        {
          category: match.category,
          keyword: match.keyword,
          lang,
          cannedReply: canned,
          handoffId: (handoffRow as any)?.id ?? null,
          instanceId: instance?.id ?? null,
        },
      );
      return json({ handoff: true, category: match.category, keyword: match.keyword, lang, handoff_id: (handoffRow as any)?.id ?? null });
    }


    // ─── Retoma automática de orçamento: procura rascunho pendente ───
    const { data: draftQuote } = await supabase.from("whatsapp_quotes")
      .select("id, contact_name, contact_email, service_type, project_description, timeline, budget_range, missing_fields, updated_at, created_at")
      .eq("conversation_id", conversationId)
      .eq("status", "a_recolher")
      .order("updated_at", { ascending: false })
      .maybeSingle();

    let draftSection = "";
    if (draftQuote) {
      const filled: string[] = [];
      const missing: string[] = [];
      const fieldLabels: Record<string, string> = {
        contact_name: "nome", contact_email: "email", service_type: "tipo de serviço",
        project_description: "descrição do projecto", timeline: "prazo", budget_range: "orçamento",
      };
      for (const [k, label] of Object.entries(fieldLabels)) {
        const v = (draftQuote as any)[k];
        if (v && String(v).trim()) filled.push(`  • ${label}: ${v}`);
        else missing.push(label);
      }
      const lastUpdate = draftQuote.updated_at || draftQuote.created_at;
      const hoursAgo = lastUpdate ? Math.round((Date.now() - new Date(lastUpdate).getTime()) / 3600000) : 0;
      const nextField = missing[0] || null;
      const timeHint = hoursAgo < 1
        ? "há poucos minutos"
        : hoursAgo < 24
          ? `há ~${hoursAgo}h`
          : `há ~${Math.round(hoursAgo / 24)} dia(s)`;
      const resumeTemplate = filled.length
        ? `Boas${conv.contact_name ? ", " + String(conv.contact_name).split(" ")[0] : ""}! 👋 Retomando o teu orçamento (ficámos ${timeHint}).\n\nJá tenho:\n${filled.map(f => f.replace(/^  • /, "✅ ")).join("\n")}\n\n${nextField ? `Falta só: *${nextField}*${missing.length > 1 ? ` (e depois: ${missing.slice(1).join(", ")})` : ""}.\n\nPodes indicar-me o *${nextField}*?` : "Está tudo — vou finalizar já ✅"}`
        : `Boas${conv.contact_name ? ", " + String(conv.contact_name).split(" ")[0] : ""}! 👋 Vamos continuar o teu orçamento. Podes indicar-me o *${nextField || "nome"}*?`;
      draftSection = `\n\n## Rascunho de orçamento em curso (RETOMA OBRIGATÓRIA)\nJá existe um orçamento aberto nesta conversa (última interacção ${timeHint}). NÃO recomeces do zero nem repitas perguntas sobre dados já recolhidos.\n\n### Dados já recolhidos (${filled.length}/6)\n${filled.length ? filled.join("\n") : "  (nenhum ainda)"}\n\n### Ainda em falta (${missing.length})\n${missing.length ? missing.map((m, i) => `  ${i + 1}. ${m}`).join("\n") : "  nada — chama já finalizar_orcamento"}\n\n### Próximo passo\n${nextField ? `Pede APENAS *${nextField}*. Não peças mais nada na mesma mensagem.` : "Chama finalizar_orcamento imediatamente."}\n\n### Formato da mensagem de retoma (usa como base, adapta ao tom)\n"""\n${resumeTemplate}\n"""\n\nRegras:\n- Reconhece explicitamente o que já foi recolhido (lista curta com ✅) para o cliente sentir que não perdeu contexto.\n- Diz claramente qual é o próximo passo (um campo só).\n- Se faltarem 2+ campos, menciona quantos faltam no total para dar visibilidade ("falta só X e Y").\n- Quando estiver tudo preenchido, chama finalizar_orcamento sem voltar a perguntar.`;
    }

    // Injeta knowledge pack do produto com base no lead mais recente deste telefone.
    // Derivação do product_slug (com fallback claro em cada passo):
    //   1) leads.resource_id → se já for um slug válido da allowlist, usa.
    //   2) leads.source com prefixo "demo:<slug>" → extrai e valida.
    //   3) leads.source contendo o nome de um produto conhecido (ex.: "Demo — Qook") → mapeia.
    //   4) Caso contrário, NÃO injeta pack (fallback ao system_prompt base).
    let productSection = "";
    try {
      const { buildProductKnowledgeSectionOrFallback, deriveProductSlugFromLead } = await import("../_shared/product-knowledge.ts");
      const { data: recentLead } = await supabase
        .from("leads")
        .select("resource_id, source")
        .eq("phone", conv.contact_phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { slug: derivedSlug, derivedFrom } = deriveProductSlugFromLead(recentLead);

      if (!derivedSlug) {
        console.log(JSON.stringify({
          level: "info",
          msg: "product_slug_fallback",
          conversation_id: conversationId,
          reason: recentLead ? "no_slug_mapped" : "no_recent_lead",
          resource_id: recentLead?.resource_id ?? null,
          source: recentLead?.source ?? null,
        }));
      } else {
        console.log(JSON.stringify({
          level: "info",
          msg: "product_slug_derived",
          conversation_id: conversationId,
          slug: derivedSlug,
          derived_from: derivedFrom,
        }));
      }

      productSection = await buildProductKnowledgeSectionOrFallback(supabase, derivedSlug);
    } catch (e) {
      console.warn("product knowledge lookup failed:", e);
      productSection = "";
    }

    const concierge = await resolveWhatsAppConciergeConfig(cfg, conv.instance_id);
    console.log(JSON.stringify({
      tag: "concierge_agent_selected",
      conversationId,
      instance_id: conv.instance_id ?? null,
      mapping_used: (concierge as any).mappingUsed ?? "unknown",
      source: (concierge as any).source,
      agent_id: (concierge as any).agentId ?? null,
      agent_name: (concierge as any).agentName ?? null,
      version_id: (concierge as any).versionId ?? null,
      model: (concierge as any).model,
    }));


    // Palete de variações de tom (saudações/transições/fechamentos) por idioma,
    // determinística por (conversationId, turnIndex) — evita frases repetidas.
    const lastUserMsg = [...aiHistory].reverse().find((m) => m.role === "user")?.content || "";
    const phrasingLang = detectConciergeLang(lastUserMsg);
    const phrasingIntent = detectPhrasingIntent(lastUserMsg);
    const phrasingSample = samplePhrasing(phrasingLang, conversationId, aiHistory.length, phrasingIntent);
    const phrasingSection = buildPhrasingPromptSection(phrasingSample);
    console.log(JSON.stringify({ tag: "concierge_phrasing_sample", conversationId, turnIndex: aiHistory.length, ...phrasingSample }));

    const systemPrompt = `${concierge.systemPrompt}\n\n## Conhecimento do site\n${SITE_KNOWLEDGE}${productSection}\n\n## Contacto atual\n- Nome: ${conv.contact_name || "(desconhecido)"}\n- Telefone: ${conv.contact_phone}${draftSection}\n\n## Persona e tom (OBRIGATÓRIO)\nÉs a Sofia, assistente comercial da Getboost Digital Studio. Falas PT-PT, informal-profissional, calorosa e humana — como se estivesses ao telefone com um amigo cliente. Usa contracções naturais ("tá", "pra", "cá") com moderação, uma expressão empática ocasional ("faz todo o sentido", "boa pergunta", "percebo"), e evita linguagem robótica ou corporativa. NUNCA digas "vou preparar uma proposta detalhada" nem "o Nuno irá rever" — em vez disso diz algo como: "Deixa-me passar isto ao nosso Director Comercial para elaborar uma proposta à medida". Frases curtas. Uma ideia por mensagem.\n\n${phrasingSection}\n\n## Regra de idioma (OBRIGATÓRIO)\nResponde SEMPRE no mesmo idioma da última mensagem do cliente: PT-PT (padrão), EN ou ES. Não misturas idiomas na mesma resposta. Nomes próprios, "Director Comercial" e o link https://getboost.digital/booking mantêm-se iguais em qualquer idioma.\n\n## Objectivo comercial (OBRIGATÓRIO)\nA tua missão é **agendar uma reunião de descoberta** (30 min) para o Director Comercial. NUNCA prometas proposta sem antes fazer descoberta + agendar reunião.\n\n### Fluxo obrigatório de descoberta (curto e humano)\nAntes de propor a reunião, faz **exactamente 2 perguntas** — uma de cada vez, nunca as duas na mesma mensagem. Escolhe as 2 mais relevantes desta lista curta, consoante o contexto do cliente:\n\n1. "Conta-me em duas linhas — o que é que queres alcançar com isto?" (objectivo)\n2. "E pra quando é que gostavas de ter isto a andar?" (prazo)\n3. "Já tentaste alguma coisa antes ou é do zero?" (contexto)\n4. "Tens uma ideia de orçamento, mesmo que aproximada?" (budget — só se fizer sentido)\n5. "Isto é pra ti, pra empresa, ou pra um cliente teu?" (quem)\n\n### Formato do convite de reunião (OBRIGATÓRIO — mesmo formato PT/EN/ES)\nQuando fores propor a reunião, **propõe SEMPRE 2 horários concretos em 2 dias DIFERENTES** (nunca no mesmo dia) e pede ao cliente para escolher UM. **NÃO envies o link do booking já** — o link só entra como alternativa se o cliente disser que nenhum dos 2 horários lhe dá jeito. Estrutura obrigatória: 1 frase curta de contexto + 2 opções numeradas (Opção 1: dia+hora / Opção 2: outro dia+hora) + pergunta "qual preferes?", no idioma do cliente. Os 2 dias têm de ser dias úteis diferentes, dentro dos próximos 5 dias úteis, um com horário de manhã e outro de tarde para dar variedade. Exemplos:\n\n- **PT:** "Fixe, já tenho o essencial 👌 Marcamos 30 min com o nosso Director Comercial? Tenho estes 2 horários:\n1️⃣ [dia A] às [hora manhã] (ex: quarta às 10h)\n2️⃣ [dia B] às [hora tarde] (ex: sexta às 15h)\nQual destes te dá mais jeito?"\n- **EN:** "Great, I've got the essentials 👌 Shall we book 30 min with our Commercial Director? I have these 2 slots:\n1️⃣ [day A] at [morning time] (e.g. Wed 10am)\n2️⃣ [day B] at [afternoon time] (e.g. Fri 3pm)\nWhich one works best for you?"\n- **ES:** "Genial, ya tengo lo esencial 👌 ¿Agendamos 30 min con nuestro Director Comercial? Tengo estos 2 horarios:\n1️⃣ [día A] a las [hora mañana] (ej: miércoles 10h)\n2️⃣ [día B] a las [hora tarde] (ej: viernes 15h)\n¿Cuál te viene mejor?"\n\nSó DEPOIS de o cliente escolher um dos horários (ou dizer que nenhum serve) é que podes chamar \`agendar_reuniao\` com a escolha, ou então oferecer o link https://getboost.digital/booking como plano B. Nunca envies os 2 horários e o link na mesma mensagem.\n\n### Fallback do link de booking (OBRIGATÓRIO)\nSe o cliente disser que o link **não abre / não funciona / dá erro / doesn't open / doesn't work / no abre / no funciona**, OU se a tool \`agendar_reuniao\` devolver \`fallback: true\` / \`error: "BOOKING_LINK_UNAVAILABLE"\`, mudas imediatamente para agendamento manual: pede DIA (uma pergunta) e depois HORA (segunda pergunta, manhã/tarde com exemplo). Assim que tiveres dia + hora, confirma explicitamente por mensagem ("Fico com [dia] às [hora] ✅ O nosso Director Comercial confirma-te em breve por aqui") e chama \`agendar_reuniao\` de novo com \`data_sugerida\` (YYYY-MM-DD) e \`hora_sugerida\` (HH:MM). Nunca insistas com o link se o cliente já disse que não abre.\n\n### Regra proposta/orçamento (OBRIGATÓRIO)\nSEMPRE que o cliente pedir **proposta / orçamento / preço / quote / price / presupuesto / precio / cotización / "quanto custa" / "how much" / "cuánto cuesta"**, tens de oferecer agendar reunião no mesmo turno, usando o formato acima no idioma do cliente (contexto + manhã/tarde esta semana + link do booking). Se ainda não fizeste as 2 perguntas de descoberta, faz a próxima pergunta primeiro; assim que estiverem feitas, todo o pedido de proposta desencadeia obrigatoriamente o convite de reunião com horários.\n\nSe o cliente pedir proposta directa antes das 2 perguntas, responde no idioma dele: *"Pra te preparar algo que faça mesmo sentido, deixa-me só perceber 2 coisas rápidas primeiro — [pergunta 1]?"* / *"To prepare something that really fits, let me just understand 2 quick things first — [question 1]?"* / *"Para prepararte algo que realmente encaje, déjame entender 2 cosas rápidas primero — [pregunta 1]?"*\n\n## Regra de escalonamento\nSe o cliente estiver frustrado, fizer perguntas fora do teu conhecimento, insistir em falar com humano, ou pedires 3x seguidas o mesmo dado sem resposta útil, chama a tool escalar_humano com um motivo claro em vez de continuar a responder.\n\n## Regra de recolha faseada (uma pergunta de cada vez)\nRecolhe dados por etapas curtas, NUNCA peças vários campos na mesma mensagem. Ordem obrigatória: 1) telefone (+351 seguido de 9 dígitos), 2) email, 3) tipo de serviço, 4) breve descrição, 5) nome. Valida formato antes de chamar tools.\n\n## Regra de fallback de tools\nSe o resultado tiver \`needs_more_data: true\`, olha para \`next_field\` e faz UMA pergunta só sobre esse campo.\n\n## Regra de cartões WhatsApp\nQuando o resultado de uma tool trouxer \`whatsapp_message\`, envia esse texto ao cliente EXATAMENTE como está (mantém emojis 👤📅✅, negrito com *asteriscos*, quebras de linha e links https://). Não reescrevas nem resumas. Podes acrescentar UMA frase curta antes ou depois se fizer sentido, mas o bloco do cartão vai íntegro.`;




    let reply: string;
    let usedFallbackReply = false;
    try {
      reply = await callLovableAI(concierge.model, systemPrompt, aiHistory, { conversationId, conv, instance }, { temperature: concierge.temperature, maxTokens: concierge.maxTokens, agentName: (concierge as any).agentName, instanceId: conv.instance_id });
    } catch (err) {
      console.error("AI error:", err);
      reply = fallbackReplyFor(lastUserMsg);
      usedFallbackReply = true;
    }
    if (!reply) return json({ skipped: "empty reply" });

    // Gate: só permite convite de reunião depois de 2 perguntas de descoberta
    const gate = enforceDiscoveryGate(aiHistory, reply);
    if (gate.overridden) {
      console.warn(JSON.stringify({
        tag: "concierge_discovery_gate",
        conversationId,
        askedBefore: gate.askedBefore,
        reason: gate.reason,
        originalPreview: reply.slice(0, 160),
        overridePreview: gate.reply.slice(0, 160),
      }));
      reply = gate.reply;
    }

    // Regra: se o utilizador pediu proposta/orçamento, garante que a resposta
    // oferece agendar reunião (com link de booking) — só actua se o gate deixou passar.
    const meetingOffer = enforceMeetingOfferOnQuoteRequest(aiHistory, reply);
    if (meetingOffer.appended) {
      console.log(JSON.stringify({
        tag: "concierge_meeting_offer_appended",
        conversationId,
        reason: meetingOffer.reason,
      }));
      reply = meetingOffer.reply;
    }


    // Validação persona / nº perguntas / convite reunião (log estruturado + persist)
    const conciergeCheck = logConciergeCheck(conversationId, aiHistory.length, reply);
    supabase.from("whatsapp_concierge_checks").insert({
      conversation_id: conversationId,
      turn_index: aiHistory.length,
      persona_ok: conciergeCheck.personaOk,
      question_count: conciergeCheck.questionCount,
      single_question_ok: conciergeCheck.singleQuestionOk,
      has_meeting_invite: conciergeCheck.hasMeetingInvite,
      has_booking_link: /getboost\.digital\/booking/i.test(reply),
      pt_pt_ok: conciergeCheck.ptPtOk,
      overridden: gate.overridden,
      override_reason: gate.reason ?? null,
      violations: conciergeCheck.violations,
      reply_preview: reply.slice(0, 300),
    }).then(({ error }) => { if (error) console.warn("concierge_check persist error:", error.message); });

    // Split reply into chunks using configured strategy
    const chunks = splitReplyIntoChunks(reply, {
      strategy: (cfg.chunk_strategy as ChunkStrategy) || "paragraph",
      maxLen: cfg.chunk_max_chars || 350,
      maxChunks: cfg.max_chunks_per_reply || MAX_CHUNKS_PER_REPLY,
    });
    const chunkDelayMs = Math.max(0, Math.min(10000, cfg.chunk_delay_ms ?? 800));
    let anySent = false;
    let lastSendRes: any = null;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (i > 0 && chunkDelayMs > 0) {
        // Show "typing…" between chunks so the receiver sees progressive activity
        sendTypingPresence(instance, conv.contact_phone, chunkDelayMs);
        await new Promise((r) => setTimeout(r, chunkDelayMs));
      }
      const sendRes = await sendWhatsAppMessage(instance, conv.contact_phone, chunk);
      lastSendRes = sendRes;
      if (sendRes.ok) anySent = true;
      await supabase.from("whatsapp_chat_messages").insert({
        conversation_id: conversationId,
        external_id: sendRes.data?.key?.id || null,
        direction: "outbound", sender: "assistant",
        content: chunk,
        status: sendRes.ok ? "sent" : "failed",
      });
    }

    await supabase.from("whatsapp_conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: reply.slice(0, 120),
    }).eq("id", conversationId);
    const sendRes = lastSendRes ?? { ok: anySent };

    // Sync history + summary into CRM lead (fire-and-forget)
    syncLeadContext({ ...conv, id: conversationId }, concierge.model).catch(e => console.error("sync err:", e));



    return json({ sent: sendRes.ok, reply, fallback: usedFallbackReply });
  } catch (e) {
    console.error("assistant-reply error:", e);
    return json({ error: String(e) }, 500);
  }
});
