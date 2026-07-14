// Auditoria Digital 360º
// Analisa: Website, SEO, Tracking, Conversão, IA Visibility
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Weights (sum = 100). Matches EasyMarketing.pt reference.
const WEIGHTS = { website: 20, seo: 25, tracking: 20, conversion: 20, aiVisibility: 15 } as const;

type Check = { id: string; label: string; pass: boolean; hint?: string };
type Pillar = { key: keyof typeof WEIGHTS; label: string; score: number; weight: number; checks: Check[] };

function extractMeta(html: string, name: string): string | null {
  const r1 = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  const m1 = html.match(r1);
  if (m1) return m1[1];
  const r2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i");
  const m2 = html.match(r2);
  return m2 ? m2[1] : null;
}
const has = (html: string, re: RegExp) => re.test(html);
const pct = (checks: Check[]) => {
  const passed = checks.filter((c) => c.pass).length;
  return Math.round((passed / checks.length) * 100);
};

async function safeFetch(url: string, timeoutMs = 10000): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Getboost-Digital-Audit/1.0" },
      redirect: "follow",
    });
    clearTimeout(t);
    return r;
  } catch {
    return null;
  }
}

async function verifyToken(email: string, url: string, token: string, secret: string): Promise<boolean> {
  try {
    const [expiresStr, sig] = token.split(".");
    const expires = Number(expiresStr);
    if (!expires || Date.now() > expires) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const payload = `${email.toLowerCase()}|${url}|${expires}`;
    const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expected)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return expectedB64 === sig;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, email, token } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !token) {
      return new Response(JSON.stringify({ error: "Email não verificado. Solicita um novo link." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ok = await verifyToken(String(email), target, String(token), secret);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Link inválido ou expirado. Pede um novo email." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: "URL inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SSRF protection
    const host = parsed.hostname.toLowerCase();
    const priv =
      host === "localhost" ||
      host === "::1" ||
      host.endsWith(".localhost") ||
      host.endsWith(".internal") ||
      /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^f[cd][0-9a-f]{2}:/i.test(host) ||
      /^fe80:/i.test(host);
    if (priv) {
      return new Response(JSON.stringify({ error: "URL não permitido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const mainRes = await safeFetch(parsed.toString(), 15000);
    if (!mainRes) {
      return new Response(JSON.stringify({ error: "Não foi possível aceder ao website." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const loadMs = Date.now() - startedAt;
    const html = await mainRes.text();
    const finalUrl = mainRes.url || parsed.toString();
    const isHttps = finalUrl.startsWith("https");
    const headers = mainRes.headers;

    // Extra fetches (best-effort, tolerate failure)
    const origin = new URL(finalUrl).origin;
    const [robotsRes, sitemapRes, llmsRes] = await Promise.all([
      safeFetch(`${origin}/robots.txt`, 5000),
      safeFetch(`${origin}/sitemap.xml`, 5000),
      safeFetch(`${origin}/llms.txt`, 5000),
    ]);
    const robotsTxt = robotsRes && robotsRes.ok ? await robotsRes.text() : "";
    const sitemapOk = !!(sitemapRes && sitemapRes.ok);
    const llmsOk = !!(llmsRes && llmsRes.ok);

    // ---------- Extractions ----------
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const metaDesc = extractMeta(html, "description") || "";
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    const hasCanonical = has(html, /<link[^>]*rel=["']canonical["']/i);
    const hasViewport = has(html, /<meta[^>]*name=["']viewport["']/i);
    const ogTitle = extractMeta(html, "og:title");
    const ogImage = extractMeta(html, "og:image");
    const imgs = html.match(/<img[^>]*>/gi) || [];
    const imgsWithAlt = imgs.filter((t) => /alt=["'][^"']+["']/i.test(t)).length;
    const altRatio = imgs.length === 0 ? 1 : imgsWithAlt / imgs.length;

    // ---------- WEBSITE (20%) ----------
    const websiteChecks: Check[] = [
      { id: "https", label: "HTTPS ativo", pass: isHttps, hint: "Instala certificado SSL." },
      {
        id: "nav",
        label: "Navegação principal presente",
        pass: has(html, /<(nav|header)[\s>]/i) || has(html, /role=["']navigation["']/i),
        hint: "Adiciona um menu de navegação claro.",
      },
      {
        id: "contact",
        label: "Contactos visíveis (email/telefone/página)",
        pass:
          has(html, /mailto:/i) ||
          has(html, /(tel:|\+351|whatsapp\.com|wa\.me)/i) ||
          has(html, /\/(contact|contacto|contactos)/i),
        hint: "Mostra email, telefone ou link para contacto.",
      },
      {
        id: "cta",
        label: "CTAs claros (botões/links de ação)",
        pass:
          (html.match(/<(button|a)[^>]*>/gi) || []).length >= 3 &&
          /(pedir|marcar|agendar|orçamento|contactar|comprar|começar|reservar|falar|book|contact|start|get\s+started)/i.test(
            html,
          ),
        hint: "Inclui pelo menos um CTA principal por secção.",
      },
      {
        id: "responsive",
        label: "Meta viewport (mobile-first)",
        pass: hasViewport,
        hint: "Adiciona <meta name=\"viewport\" ...> para dispositivos móveis.",
      },
      {
        id: "speed",
        label: `Tempo de resposta (${(loadMs / 1000).toFixed(2)}s)`,
        pass: loadMs < 3000,
        hint: "Otimiza imagens, cache e servidor para <3s.",
      },
    ];

    // ---------- SEO (25%) ----------
    const seoChecks: Check[] = [
      { id: "title", label: "Title tag (10–60 caracteres)", pass: title.length >= 10 && title.length <= 60 },
      { id: "meta", label: "Meta description (50–160 caracteres)", pass: metaDesc.length >= 50 && metaDesc.length <= 160 },
      { id: "h1", label: "Um único H1 na página", pass: h1Count === 1 },
      { id: "h2", label: "Subtítulos H2 presentes", pass: h2Count >= 1 },
      { id: "robots", label: "robots.txt disponível", pass: !!robotsTxt },
      { id: "sitemap", label: "sitemap.xml disponível", pass: sitemapOk || /sitemap:/i.test(robotsTxt) },
      { id: "canonical", label: "Canonical definido", pass: hasCanonical },
      { id: "alt", label: `Alt em imagens (${imgsWithAlt}/${imgs.length})`, pass: altRatio >= 0.8 },
      { id: "og", label: "Open Graph (og:title + og:image)", pass: !!ogTitle && !!ogImage },
    ];

    // ---------- TRACKING (20%) ----------
    const hasGTM = /googletagmanager\.com\/(gtm|gtag)/i.test(html) || /GTM-[A-Z0-9]+/i.test(html);
    const hasGA4 = /google-analytics\.com\/g\/collect/i.test(html) || /G-[A-Z0-9]{6,}/i.test(html) || /gtag\(\s*['"]config['"]\s*,\s*['"]G-/i.test(html);
    const hasMetaPixel = /connect\.facebook\.net\/.+\/fbevents\.js/i.test(html) || /fbq\s*\(\s*['"](init|track)['"]/i.test(html);
    const hasCMP =
      /(cookiebot|onetrust|iubenda|cookie-?script|complianz|didomi|termly|klaro|cookieconsent|axeptio|cookiefirst)/i.test(html) ||
      /(cookie|rgpd|gdpr).{0,80}(consent|banner|aceit|accept)/i.test(html);
    const hasConsentMode = /gtag\(\s*['"]consent['"]/i.test(html) || /google_tag_manager.*consent/i.test(html);

    const trackingChecks: Check[] = [
      { id: "gtm", label: "Google Tag Manager", pass: hasGTM, hint: "Centraliza tags via GTM." },
      { id: "ga4", label: "Google Analytics 4", pass: hasGA4, hint: "Instala GA4 para medir tráfego." },
      { id: "pixel", label: "Meta Pixel (Facebook/Instagram)", pass: hasMetaPixel, hint: "Instala Pixel para remarketing." },
      { id: "cmp", label: "Banner de consentimento (CMP)", pass: hasCMP, hint: "RGPD exige recolha de consentimento." },
      { id: "consent-mode", label: "Google Consent Mode v2", pass: hasConsentMode, hint: "Ativa Consent Mode para EEA." },
    ];

    // ---------- CONVERSÃO (20%) ----------
    const hasForm = /<form[\s>]/i.test(html);
    const hasWhatsApp = /(wa\.me|api\.whatsapp\.com|whatsapp:\/\/)/i.test(html);
    const hasTestimonial = /(testemunh|testimonial|review|avalia\u00e7|reviews?|estrelas?|stars?)/i.test(html);
    const hasSocialProof = /(clientes?|projetos?|anos? de|\+\s*\d{2,}|\d{2,}\s*(clientes|projetos|reviews))/i.test(html);
    const hasEmailCapture = /(newsletter|subscrever|subscribe|email)/i.test(html) && hasForm;
    const hasPricing = /(pre\u00e7os?|planos?|pricing|orçamento|orcamento)/i.test(html);

    const conversionChecks: Check[] = [
      { id: "form", label: "Formulário de contacto/lead", pass: hasForm, hint: "Adiciona formulário para captar leads." },
      { id: "whatsapp", label: "Contacto rápido via WhatsApp", pass: hasWhatsApp, hint: "Adiciona botão WhatsApp." },
      { id: "testimonial", label: "Testemunhos / reviews visíveis", pass: hasTestimonial, hint: "Inclui prova social." },
      { id: "social-proof", label: "Números / prova social", pass: hasSocialProof, hint: "Mostra clientes, anos, projetos." },
      { id: "newsletter", label: "Captura de email (newsletter)", pass: hasEmailCapture, hint: "Cria funil de nurturing." },
      { id: "pricing", label: "Referência a preços/planos", pass: hasPricing, hint: "Transparência acelera decisão." },
    ];

    // ---------- IA VISIBILITY (15%) ----------
    // JSON-LD schemas
    const ldBlocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((m) => m[1]);
    const ldTypes: string[] = [];
    for (const block of ldBlocks) {
      const types = block.match(/"@type"\s*:\s*"([^"]+)"/g) || [];
      for (const t of types) {
        const m = t.match(/"([^"]+)"$/);
        if (m) ldTypes.push(m[1]);
      }
    }
    const hasOrgSchema = ldTypes.some((t) => /Organization|LocalBusiness|Person/i.test(t));
    const hasFaqSchema = ldTypes.some((t) => /FAQPage|QAPage/i.test(t)) || /faq/i.test(html);
    const hasServiceSchema = ldTypes.some((t) => /Service|Product|Offer/i.test(t));
    const hasBreadcrumb = ldTypes.some((t) => /BreadcrumbList/i.test(t));

    const aiChecks: Check[] = [
      { id: "ld-org", label: "Schema Organization / LocalBusiness", pass: hasOrgSchema, hint: "Ajuda LLMs a citar-te." },
      { id: "ld-faq", label: "FAQ estruturado ou schema FAQPage", pass: hasFaqSchema, hint: "IA usa FAQs para respostas." },
      { id: "ld-service", label: "Schema Service/Product", pass: hasServiceSchema, hint: "Descreve serviços com JSON-LD." },
      { id: "ld-breadcrumb", label: "Breadcrumbs estruturados", pass: hasBreadcrumb },
      { id: "og", label: "Open Graph completo", pass: !!ogTitle && !!ogImage },
      { id: "llms", label: "Ficheiro /llms.txt para modelos IA", pass: llmsOk, hint: "Adiciona /llms.txt para orientar LLMs." },
    ];

    const pillars: Pillar[] = [
      { key: "website", label: "Website", weight: WEIGHTS.website, score: pct(websiteChecks), checks: websiteChecks },
      { key: "seo", label: "SEO", weight: WEIGHTS.seo, score: pct(seoChecks), checks: seoChecks },
      { key: "tracking", label: "Tracking", weight: WEIGHTS.tracking, score: pct(trackingChecks), checks: trackingChecks },
      { key: "conversion", label: "Conversão", weight: WEIGHTS.conversion, score: pct(conversionChecks), checks: conversionChecks },
      { key: "aiVisibility", label: "IA Visibility", weight: WEIGHTS.aiVisibility, score: pct(aiChecks), checks: aiChecks },
    ];

    const overallScore = Math.round(pillars.reduce((acc, p) => acc + (p.score * p.weight) / 100, 0));
    const rating =
      overallScore >= 85 ? "Excelente" : overallScore >= 70 ? "Bom" : overallScore >= 50 ? "Razoável" : overallScore >= 30 ? "Fraco" : "Crítico";

    // Top prioridades: falhas ordenadas por peso do pilar
    const priorities = pillars
      .flatMap((p) => p.checks.filter((c) => !c.pass).map((c) => ({ pillar: p.label, weight: p.weight, ...c })))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);

    return new Response(
      JSON.stringify({
        url: finalUrl,
        overallScore,
        rating,
        pillars,
        priorities,
        meta: { title, metaDesc, loadMs, statusCode: mainRes.status, isHttps },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Erro ao analisar. Tenta novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
