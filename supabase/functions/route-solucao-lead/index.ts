// Edge function: route-solucao-lead
// Recebe um lead capturado numa página /solucoes/<slug>, consulta a tabela
// `solucao_routing`, dispara notificações por email para os destinatários
// configurados e adiciona o contacto à lista Brevo mapeada (se existir).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  slug: z.string().min(1).max(120),
  lead: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().max(40).optional().nullable(),
    company: z.string().max(200).optional().nullable(),
    service: z.string().max(200).optional().nullable(),
    role: z.string().max(120).optional().nullable(),
    message: z.string().max(4000).optional().nullable(),
  }),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const { slug, lead } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Consulta o mapeamento (fallback para o default se não existir)
    const { data: routing } = await supabase
      .from('solucao_routing')
      .select('slug, title, notify_email, cc_emails, brevo_list_id, crm_pipeline, crm_stage, owner_name, active')
      .eq('slug', slug)
      .maybeSingle();

    const active = routing?.active ?? true;
    const notifyEmail = routing?.notify_email || 'nunocruz@getboost.digital';
    const ccEmails: string[] = Array.isArray(routing?.cc_emails) ? routing!.cc_emails : [];
    const brevoListId = routing?.brevo_list_id ?? null;
    const title = routing?.title || lead.service || slug;

    const results: Record<string, unknown> = {
      slug,
      routed_to: notifyEmail,
      cc: ccEmails,
      brevo_list_id: brevoListId,
      crm_pipeline: routing?.crm_pipeline ?? null,
      crm_stage: routing?.crm_stage ?? null,
      owner: routing?.owner_name ?? null,
      email: 'skipped',
      brevo: 'skipped',
    };

    if (!active) {
      return new Response(JSON.stringify({ success: true, ...results, reason: 'routing_inactive' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const templateData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? null,
      company: lead.company ?? null,
      service: title,
      message: [
        `Solução: ${title}`,
        routing?.crm_pipeline && `Pipeline: ${routing.crm_pipeline}`,
        routing?.crm_stage && `Etapa: ${routing.crm_stage}`,
        routing?.owner_name && `Responsável: ${routing.owner_name}`,
        lead.role && `Cargo: ${lead.role}`,
        lead.message && `\n${lead.message}`,
      ].filter(Boolean).join('\n'),
    };

    // Envia emails (um por destinatário — send-transactional-email não tem CC nativo)
    const recipients = [notifyEmail, ...ccEmails].filter((v, i, arr) => v && arr.indexOf(v) === i);
    const emailResults = await Promise.allSettled(
      recipients.map((to) =>
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'lead-notification',
            recipientEmail: to,
            idempotencyKey: `solucao-${slug}-${lead.email}-${Date.now()}-${to}`,
            templateData,
          },
        }),
      ),
    );
    results.email = emailResults.map((r, i) => ({ to: recipients[i], ok: r.status === 'fulfilled' }));

    // Adiciona à lista Brevo, se configurada
    if (brevoListId) {
      try {
        const [firstName, ...rest] = lead.name.split(/\s+/);
        const brevoRes = await supabase.functions.invoke('brevo-proxy', {
          body: {
            action: 'contacts.create',
            params: {
              email: lead.email,
              attributes: {
                FIRSTNAME: firstName || lead.name,
                LASTNAME: rest.join(' ') || '',
                SMS: lead.phone || undefined,
                COMPANY: lead.company || undefined,
                SOLUCAO: title,
              },
              listIds: [brevoListId],
              updateEnabled: true,
            },
          },
        });
        results.brevo = brevoRes.error ? { ok: false, error: String(brevoRes.error) } : { ok: true };
      } catch (err) {
        results.brevo = { ok: false, error: (err as Error).message };
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('route-solucao-lead error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
