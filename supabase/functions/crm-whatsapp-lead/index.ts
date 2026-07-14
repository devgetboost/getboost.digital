// Forwards WhatsApp CTA conversions (template + UTMs) to an external CRM webhook.
// Configure the destination via the CRM_WEBHOOK_URL secret. Fire-and-forget from client.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const logValidationFailure = async (raw: any, issues: unknown) => {
  try {
    const r = (raw ?? {}) as Record<string, any>;
    const utms = (r.utms ?? {}) as Record<string, any>;
    await admin.from('crm_validation_failures').insert({
      location: typeof r.location === 'string' ? r.location.slice(0, 200) : null,
      template: typeof r.template === 'string' ? r.template.slice(0, 200) : null,
      click_id: typeof r.click_id === 'string' ? r.click_id.slice(0, 200) : null,
      page_url: typeof r.page_url === 'string' ? r.page_url.slice(0, 2048) : null,
      referrer: typeof r.referrer === 'string' ? r.referrer.slice(0, 2048) : null,
      utm_source: typeof utms.utm_source === 'string' ? utms.utm_source : null,
      utm_medium: typeof utms.utm_medium === 'string' ? utms.utm_medium : null,
      utm_campaign: typeof utms.utm_campaign === 'string' ? utms.utm_campaign : null,
      issues,
      raw_payload: r,
    });
  } catch (e) {
    console.error('[crm-whatsapp-lead] failed to persist validation failure', e);
  }
};


const UTMSchema = z
  .object({
    utm_source: z.string().min(1).max(120).optional(),
    utm_medium: z.string().min(1).max(120).optional(),
    utm_campaign: z.string().min(1).max(120).optional(),
    utm_term: z.string().max(120).optional(),
    utm_content: z.string().max(120).optional(),
  })
  .passthrough();

const PayloadSchema = z.object({
  event: z.enum(['whatsapp_conversion', 'form_conversion']).default('whatsapp_conversion'),
  location: z.string().min(1).max(120),
  template: z.string().min(1).max(120),
  click_id: z.string().max(120).optional(),
  page_url: z.string().url().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  utms: UTMSchema.optional().default({}),
  data: z.record(z.unknown()).optional().default({}),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    console.warn('[crm-whatsapp-lead] invalid JSON body');
    await logValidationFailure({}, { _root: ['invalid JSON body'] });
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    console.warn('[crm-whatsapp-lead] validation failed', JSON.stringify({ issues, raw }));
    await logValidationFailure(raw, issues);
    return new Response(JSON.stringify({ error: 'invalid payload', issues }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }



  const body = parsed.data;
  const utms = body.utms ?? {};
  const missingUtms = ['utm_source', 'utm_medium', 'utm_campaign'].filter((k) => !(utms as any)[k]);
  if (missingUtms.length > 0) {
    console.warn('[crm-whatsapp-lead] UTM fallback missing', {
      click_id: body.click_id,
      location: body.location,
      template: body.template,
      missing: missingUtms,
    });
  }

  const enriched = {
    occurred_at: new Date().toISOString(),
    source: 'getboost-site',
    ...body,
  };

  console.log('[crm-whatsapp-lead] ok', JSON.stringify({
    event: enriched.event,
    click_id: body.click_id,
    location: body.location,
    template: body.template,
    utms,
  }));

  try {
    const webhook = Deno.env.get('CRM_WEBHOOK_URL');
    if (!webhook) {
      console.log('[crm-whatsapp-lead] CRM_WEBHOOK_URL not set; payload =', enriched);
      return new Response(JSON.stringify({ ok: true, forwarded: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });

    if (!resp.ok) {
      const details = await resp.text();
      console.error(`[crm-whatsapp-lead] CRM webhook failed [${resp.status}]: ${details}`);
      return new Response(JSON.stringify({ ok: false, status: resp.status, details }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, forwarded: true, click_id: body.click_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[crm-whatsapp-lead] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

});
