import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SEOResult {
  url: string;
  overallScore: number;
  rating: string;
  scores: {
    onPage: number;
    technical: number;
    performance: number;
    security: number;
  };
  metrics: {
    pageSpeed: { value: number; label: string };
    mobileOptimization: { value: number; label: string };
    metaTags: { value: number; label: string };
    sslCertificate: { value: number; label: string };
    socialTags: { value: number; label: string };
    cookieConsent: { value: number; label: string };
  };
  details: {
    pageLoadTime: string;
    imageOptimization: string;
    internalLinks: number;
    sslStatus: string;
  };
  issues: {
    critical: { title: string; description: string }[];
    warnings: { title: string; description: string }[];
  };
  passed: string[];
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i');
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const { url, email } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lead-gating: caller must have submitted a lead via the public form first.
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: lead, error: leadErr } = await sb
      .from("leads")
      .select("id")
      .ilike("email", email.trim())
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Submete o formulário antes de analisar." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    // SSRF protection: only https and reject internal/private/loopback hosts
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: "URL inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return new Response(JSON.stringify({ error: "Apenas URLs http(s) são suportados." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate =
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".internal") ||
      /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^(::ffff:)?(127|10|0)\./.test(hostname) ||
      /^f[cd][0-9a-f]{2}:/i.test(hostname) ||
      /^fe80:/i.test(hostname);
    if (isPrivate) {
      return new Response(JSON.stringify({ error: "URL não permitido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    targetUrl = parsedUrl.toString();

    const startTime = Date.now();
    let html = "";
    let fetchOk = false;
    let isHttps = targetUrl.startsWith("https");
    let statusCode = 0;
    let headers: Headers | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "NunoCruz-SEO-Analyzer/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);
      statusCode = response.status;
      headers = response.headers;
      html = await response.text();
      fetchOk = true;
      isHttps = response.url.startsWith("https");
    } catch {
      return new Response(
        JSON.stringify({ error: "Não foi possível aceder ao website. Verifica o URL e tenta novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const loadTime = Date.now() - startTime;

    // --- Analysis ---
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titleText = titleMatch ? titleMatch[1].trim() : "";
    const hasH1 = /<h1[\s>]/i.test(html);
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const metaDesc = extractMetaContent(html, "description");
    const hasMetaDesc = !!metaDesc;
    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
    const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    const ogTitle = extractMetaContent(html, "og:title");
    const ogDesc = extractMetaContent(html, "og:description");
    const ogImage = extractMetaContent(html, "og:image");
    const twitterCard = extractMetaContent(html, "twitter:card");
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsWithAlt = imgTags.filter(t => /alt=["'][^"']+["']/i.test(t)).length;
    const internalLinks = (html.match(/<a[^>]*href=["'][^"']*["']/gi) || []).length;
    const hasRobotsTxt = true; // Assume exists
    const wordCount = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;

    // Scores calculation
    let onPage = 0;
    if (hasTitle) onPage += 20;
    if (titleText.length > 10 && titleText.length <= 60) onPage += 10;
    else if (titleText.length > 0) onPage += 5;
    if (hasH1) onPage += 20;
    if (h1Count === 1) onPage += 5;
    if (hasMetaDesc) onPage += 15;
    if (metaDesc && metaDesc.length <= 160 && metaDesc.length >= 50) onPage += 10;
    else if (metaDesc && metaDesc.length > 0) onPage += 5;
    if (hasCanonical) onPage += 10;
    if (wordCount > 300) onPage += 10;
    else if (wordCount > 100) onPage += 5;
    onPage = Math.min(onPage, 100);

    let technical = 0;
    if (hasViewport) technical += 25;
    if (statusCode >= 200 && statusCode < 400) technical += 25;
    if (isHttps) technical += 25;
    if (hasCanonical) technical += 15;
    if (hasRobotsTxt) technical += 10;
    technical = Math.min(technical, 100);

    let performance = 0;
    if (loadTime < 1000) performance = 100;
    else if (loadTime < 2000) performance = 85;
    else if (loadTime < 3000) performance = 70;
    else if (loadTime < 5000) performance = 50;
    else performance = 30;

    let security = 0;
    if (isHttps) security += 50;
    const hasHSTS = headers?.get("strict-transport-security") ? true : false;
    if (hasHSTS) security += 15;
    const hasXFrame = headers?.get("x-frame-options") ? true : false;
    if (hasXFrame) security += 10;
    const hasCSP = headers?.get("content-security-policy") ? true : false;
    if (hasCSP) security += 15;
    if (statusCode < 400) security += 10;
    security = Math.min(security, 100);

    const socialScore = [ogTitle, ogDesc, ogImage, twitterCard].filter(Boolean).length;
    const socialTags = Math.round((socialScore / 4) * 100);

    const metaTagsScore = [hasTitle, hasMetaDesc, hasViewport, hasCanonical].filter(Boolean).length;
    const metaTagsPercent = Math.round((metaTagsScore / 4) * 100);

    const hasCookieConsent = /cookie/i.test(html) && (/consent|banner|gdpr|rgpd/i.test(html));
    const cookieScore = hasCookieConsent ? 100 : 0;

    const overallScore = Math.round((onPage * 0.3 + technical * 0.25 + performance * 0.25 + security * 0.2));
    const rating = overallScore >= 80 ? "Excelente" : overallScore >= 60 ? "Bom" : overallScore >= 40 ? "Razoável" : "Fraco";

    // Issues
    const critical: { title: string; description: string }[] = [];
    const warnings: { title: string; description: string }[] = [];
    const passed: string[] = [];

    if (!hasH1) critical.push({ title: "Etiqueta H1 ausente", description: "A tua página não possui um título H1. Isso é importante para SEO e para a estrutura do conteúdo." });
    if (!isHttps) critical.push({ title: "Website sem HTTPS", description: "O teu site não utiliza certificado SSL. Isto afeta a segurança e o posicionamento no Google." });
    if (!hasTitle) critical.push({ title: "Título da página ausente", description: "A página não tem uma tag <title>. Isto é essencial para SEO." });

    if (titleText.length > 60) warnings.push({ title: "Título muito longo", description: `O teu título tem ${titleText.length} caracteres. Títulos com mais de 60 caracteres podem ser truncados nos resultados da pesquisa.` });
    if (metaDesc && metaDesc.length > 160) warnings.push({ title: "Meta descrição muito longa", description: `A tua meta descrição tem ${metaDesc.length} caracteres e pode ser truncada.` });
    if (!hasMetaDesc) warnings.push({ title: "Meta descrição ausente", description: "Adiciona uma meta descrição para melhorar a taxa de cliques nos resultados de pesquisa." });
    if (wordCount < 300) warnings.push({ title: "Conteúdo reduzido", description: `A tua página tem apenas ${wordCount} palavras. Os motores de busca priorizam páginas com conteúdo mais substancial.` });
    if (imgTags.length > 0 && imgsWithAlt < imgTags.length) warnings.push({ title: "Imagens sem atributo alt", description: `${imgTags.length - imgsWithAlt} de ${imgTags.length} imagens não possuem texto alternativo.` });
    if (!hasCookieConsent) warnings.push({ title: "Consentimento de cookies não detetado", description: "Não foi detetado um banner de cookies/RGPD na página." });
    if (socialScore < 3) warnings.push({ title: "Tags sociais incompletas", description: "Faltam Open Graph ou Twitter Card tags para melhorar a partilha nas redes sociais." });

    if (hasCanonical) passed.push("Conjunto de URLs canónicas");
    if (hasViewport) passed.push("Janela de visualização configurada");
    if (isHttps) passed.push("HTTPS ativado");
    if (hasTitle) passed.push("Tag de título presente");
    if (hasH1) passed.push("Etiqueta H1 presente");
    if (hasMetaDesc) passed.push("Meta descrição presente");

    const result: SEOResult = {
      url: targetUrl,
      overallScore,
      rating,
      scores: { onPage, technical, performance, security },
      metrics: {
        pageSpeed: { value: performance, label: "Velocidade da Página" },
        mobileOptimization: { value: hasViewport ? 100 : 30, label: "Otimização Mobile" },
        metaTags: { value: metaTagsPercent, label: "Meta Tags" },
        sslCertificate: { value: isHttps ? 85 : 0, label: "Certificado SSL" },
        socialTags: { value: socialTags, label: "Tags Sociais" },
        cookieConsent: { value: cookieScore, label: "Consentimento de Cookies" },
      },
      details: {
        pageLoadTime: `${(loadTime / 1000).toFixed(3)} s`,
        imageOptimization: `${imgsWithAlt}/${imgTags.length}`,
        internalLinks,
        sslStatus: isHttps ? "Seguro" : "Não seguro",
      },
      issues: { critical, warnings },
      passed,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao analisar o website. Tenta novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
