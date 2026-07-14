import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  console.log(JSON.stringify({ runId, level: 'info', msg: 'sla_run_started' }));

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const backupUserId = Deno.env.get('ADMIN_TASKS_BACKUP_USER_ID') || null;
  const crmWebhook = Deno.env.get('CRM_WEBHOOK_URL');
  const nowIso = new Date().toISOString();

  const { data: overdue, error } = await supabase
    .from('admin_tasks')
    .select('*')
    .in('status', ['pending', 'in_progress'])
    .in('priority', ['urgent', 'high', 'medium', 'normal'])
    .lte('sla_due_at', nowIso)
    .limit(200);

  if (error) {
    console.error(JSON.stringify({ runId, level: 'error', msg: 'sla_fetch_failed', error: error.message }));
    return new Response(JSON.stringify({ error: error.message, runId }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(JSON.stringify({ runId, level: 'info', msg: 'sla_candidates', count: overdue?.length ?? 0 }));

  const results: Array<Record<string, unknown>> = [];

  for (const task of overdue ?? []) {
    const reassignCount = (task.reassign_count as number) ?? 0;
    const dueAt = task.sla_due_at ? new Date(task.sla_due_at as string).getTime() : Date.now();
    const overdueMinutes = Math.max(0, Math.round((Date.now() - dueAt) / 60000));
    const patch: Record<string, unknown> = { sla_breached_at: task.sla_breached_at ?? nowIso };
    let action: 'reassigned' | 'escalated';
    let reason: string;

    if (reassignCount === 0 && backupUserId && task.assigned_to !== backupUserId) {
      const extendMinutes = Number(task.sla_minutes ?? 60);
      const newDue = new Date(Date.now() + extendMinutes * 60_000).toISOString();
      patch.reassigned_from = task.assigned_to;
      patch.assigned_to = backupUserId;
      patch.reassigned_at = nowIso;
      patch.reassign_count = reassignCount + 1;
      patch.sla_due_at = newDue;
      patch.status = 'in_progress';
      action = 'reassigned';
      reason = `sla_breach:first (overdue ${overdueMinutes}min, priority=${task.priority})`;
    } else if (!task.escalated_at) {
      patch.escalated_at = nowIso;
      patch.priority = 'urgent';
      action = 'escalated';
      reason = reassignCount > 0
        ? `sla_breach:post_reassignment (overdue ${overdueMinutes}min, reassign_count=${reassignCount})`
        : `sla_breach:no_backup_available (overdue ${overdueMinutes}min)`;
    } else {
      continue;
    }

    const { error: upErr } = await supabase.from('admin_tasks').update(patch).eq('id', task.id);
    if (upErr) {
      console.error(JSON.stringify({ runId, level: 'error', msg: 'update_failed', admin_task_id: task.id, error: upErr.message }));
      continue;
    }

    console.log(JSON.stringify({
      runId, level: 'info', msg: 'sla_action', action,
      admin_task_id: task.id, title: task.title, priority: patch.priority ?? task.priority,
      previous_assignee: task.assigned_to, new_assignee: patch.assigned_to ?? task.assigned_to,
      reassign_count: patch.reassign_count ?? reassignCount, overdue_minutes: overdueMinutes, reason,
    }));

    if (crmWebhook) {
      const webhookPayload = {
        event: action === 'escalated' ? 'admin_task_escalated' : 'admin_task_reassigned',
        run_id: runId,
        timestamp: nowIso,
        admin_task_id: task.id,
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          task_type: task.task_type,
          link_url: task.link_url,
          lead_id: task.lead_id,
          quote_id: task.quote_id,
          created_at: task.created_at,
        },
        sla: {
          minutes: task.sla_minutes,
          due_at: task.sla_due_at,
          new_due_at: patch.sla_due_at ?? task.sla_due_at,
          overdue_minutes: overdueMinutes,
          breached_at: patch.sla_breached_at,
          breach_reason: reason,
        },
        assignment: {
          previous_assignee: task.assigned_to,
          new_assignee: patch.assigned_to ?? task.assigned_to,
          reassigned_from: patch.reassigned_from ?? null,
          reassign_count: patch.reassign_count ?? reassignCount,
          escalated_at: patch.escalated_at ?? null,
        },
        priority: {
          previous: task.priority,
          current: patch.priority ?? task.priority,
        },
      };

      try {
        const res = await fetch(crmWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Event-Source': 'admin-tasks-sla' },
          body: JSON.stringify(webhookPayload),
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(JSON.stringify({ runId, level: 'error', msg: 'crm_webhook_non_2xx', admin_task_id: task.id, status: res.status, body }));
        } else {
          console.log(JSON.stringify({ runId, level: 'info', msg: 'crm_webhook_sent', admin_task_id: task.id, status: res.status }));
        }
      } catch (e) {
        console.error(JSON.stringify({ runId, level: 'error', msg: 'crm_webhook_failed', admin_task_id: task.id, error: (e as Error).message }));
      }
    } else {
      console.warn(JSON.stringify({ runId, level: 'warn', msg: 'crm_webhook_url_missing', admin_task_id: task.id }));
    }

    results.push({ admin_task_id: task.id, action, reason, overdue_minutes: overdueMinutes });
  }

  console.log(JSON.stringify({ runId, level: 'info', msg: 'sla_run_finished', processed: results.length, duration_ms: Date.now() - startedAt }));

  return new Response(JSON.stringify({ runId, processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
