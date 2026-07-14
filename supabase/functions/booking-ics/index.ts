import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEETING_LABELS: Record<string, string> = {
  discovery: 'Consulta de Descoberta (30 min)',
  strategy: 'Sessão de Estratégia (60 min)',
};
const DURATION_MIN: Record<string, number> = { discovery: 30, strategy: 60 };

function pad(n: number) { return String(n).padStart(2, '0'); }
function toIcsUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escapeIcs(s: string): string {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

// Convert Lisbon-local (YYYY-MM-DD HH:mm) to a UTC Date, honoring DST.
function lisbonToUtc(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(guess).reduce<Record<string, string>>((a, p) => (a[p.type] = p.value, a), {});
  const asLisbon = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute),
  );
  return new Date(guess.getTime() - (asLisbon - guess.getTime()));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: b, error } = await supabase.from('bookings')
      .select('id, name, email, meeting_type, meeting_date, meeting_time, jitsi_room, challenges')
      .eq('id', id).maybeSingle();

    if (error || !b) {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    const startUtc = lisbonToUtc(b.meeting_date, b.meeting_time);
    const duration = DURATION_MIN[b.meeting_type] ?? 30;
    const endUtc = new Date(startUtc.getTime() + duration * 60_000);
    const link = b.jitsi_room ? `https://meet.jit.si/${b.jitsi_room}` : 'https://getboost.digital/booking';
    const summary = `Getboost — ${MEETING_LABELS[b.meeting_type] ?? 'Reunião'}`;
    const description = `Reunião com ${b.name || ''}\\n${link}${b.challenges ? '\\n\\n' + b.challenges : ''}`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Getboost//Booking//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${b.id}@getboost.digital`,
      `DTSTAMP:${toIcsUtc(new Date())}`,
      `DTSTART:${toIcsUtc(startUtc)}`,
      `DTEND:${toIcsUtc(endUtc)}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(link)}`,
      `URL:${escapeIcs(link)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="reuniao-getboost.ics"`,
      },
    });
  } catch (e) {
    console.error('booking-ics error:', e);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
