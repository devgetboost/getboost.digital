import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'nunocruz@getboost.digital';

// Simple input validation helpers
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function sanitize(input: string, maxLength = 500): string {
  return input.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

// ── Timezone handling ────────────────────────────────────────────────────
// Single source of truth on the server so every booking endpoint validates
// the lead's timezone and derives the displayed slot the same way.
const ALLOWED_TZ = {
  lisbon: 'Europe/Lisbon',
  madeira: 'Atlantic/Madeira',
  azores: 'Atlantic/Azores',
  brazil: 'America/Sao_Paulo',
} as const;
type TzKey = keyof typeof ALLOWED_TZ;
const TZ_LABELS: Record<TzKey, string> = {
  lisbon: 'Lisboa', madeira: 'Madeira', azores: 'Açores', brazil: 'Brasília',
};

function normalizeTzKey(input: unknown): TzKey {
  if (typeof input !== 'string') return 'lisbon';
  const k = input.trim().toLowerCase();
  if (k in ALLOWED_TZ) return k as TzKey;
  if (k === 'lisboa' || k === 'portugal' || k === 'europe/lisbon') return 'lisbon';
  if (k === 'atlantic/madeira') return 'madeira';
  if (k === 'acores' || k === 'açores' || k === 'atlantic/azores') return 'azores';
  if (k === 'brasil' || k === 'brasilia' || k === 'brasília' || k === 'america/sao_paulo') return 'brazil';
  return 'lisbon';
}

// Convert HH:mm Lisbon-local on YYYY-MM-DD into HH:mm on the target tz.
function convertFromLisbon(date: string, time: string, tzKey: TzKey): string {
  const target = ALLOWED_TZ[tzKey];
  if (target === 'Europe/Lisbon') return time;
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return time;
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(guess).reduce<Record<string, string>>((a, p) => (a[p.type] = p.value, a), {});
  const asLisbon = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  const utc = new Date(guess.getTime() - (asLisbon - guess.getTime()));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: target, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(utc);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT - ensure caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const booking = await req.json();
    
    const { name, email, meeting_type, meeting_date, meeting_time, meeting_time_display, timezone, timezone_label, company, challenges } = booking;

    // Validate required fields
    if (!name || !email || !meeting_type || !meeting_date || !meeting_time) {
      return new Response(JSON.stringify({ error: 'Missing required booking fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate types and lengths
    if (typeof name !== 'string' || typeof email !== 'string' || typeof meeting_type !== 'string' ||
        typeof meeting_date !== 'string' || typeof meeting_time !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid field types' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedTypes = ['discovery', 'strategy'];
    if (!allowedTypes.includes(meeting_type)) {
      return new Response(JSON.stringify({ error: 'Invalid meeting type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meeting_date)) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate meeting_time (HH:MM 24h, Lisbon-local reference)
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(meeting_time)) {
      return new Response(JSON.stringify({ error: 'Invalid time format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate + normalize timezone; derive displayed slot server-side so we
    // never trust the client-provided meeting_time_display.
    if (timezone !== undefined && typeof timezone !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid timezone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const tzKey = normalizeTzKey(timezone);
    const tzLabel = TZ_LABELS[tzKey];
    const displayTime = convertFromLisbon(meeting_date, meeting_time, tzKey);

    // Sanitize inputs
    const safeName = sanitize(name, 100);
    const safeCompany = company ? sanitize(String(company), 200) : 'N/A';
    const safeChallenges = challenges ? sanitize(String(challenges), 1000) : '';

    const meetingLabels: Record<string, string> = {
      discovery: 'Consulta de Descoberta (30 min)',
      strategy: 'Sessão de Estratégia (60 min)',
    };

    console.log(`📧 New booking notification:`);
    console.log(`  Name: ${safeName}`);
    console.log(`  Email: ${email}`);
    console.log(`  Type: ${meetingLabels[meeting_type]}`);
    console.log(`  Date: ${meeting_date}`);
    console.log(`  Time (Lisbon): ${meeting_time}`);
    if (tzKey !== 'lisbon') {
      console.log(`  Time (${tzLabel}): ${displayTime}`);
    }
    console.log(`  Timezone: ${tzLabel} (${tzKey})`);
    if (meeting_time_display && meeting_time_display !== displayTime) {
      console.warn(`  ⚠️  client-supplied meeting_time_display=${meeting_time_display} did not match server conversion=${displayTime}; using server value`);
    }
    if (timezone_label && timezone_label !== tzLabel) {
      console.warn(`  ⚠️  client-supplied timezone_label=${timezone_label} did not match server label=${tzLabel}`);
    }
    console.log(`  Company: ${safeCompany}`);
    console.log(`  Challenges: ${safeChallenges}`);

    return new Response(JSON.stringify({
      success: true, 
      message: 'Notification processed',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing booking notification:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
