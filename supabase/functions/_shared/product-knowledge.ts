// Fetches a product knowledge pack from `product_knowledge` and builds
// a prompt section to inject into concierge/assistant system prompts.
//
// Segurança / fallback:
// - Slugs devem ser [a-z0-9-]{1,40}. Qualquer coisa fora disso → null.
// - Slugs fora da allowlist (ou "geral") → não injeta nada (fallback ao system_prompt base).
// - Se o pack não existir, estiver inativo, vier vazio ou der erro na BD → devolve ""
//   (o chamador concatena "" sem partir o prompt base).

const ALLOWED_SLUGS = new Set([
  "qook", "motivae", "hostify", "pikto", "trackfy", "prosafe360", "geral",
]);
const SLUG_RE = /^[a-z0-9-]{1,40}$/;

export function normalizeProductSlug(raw?: string | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || !SLUG_RE.test(s)) return null;
  return ALLOWED_SLUGS.has(s) ? s : null;
}

export type LeadForSlugDerivation = {
  resource_id?: string | null;
  source?: string | null;
} | null | undefined;

export type SlugDerivationResult = {
  slug: string | null;
  derivedFrom: "resource_id" | "source_demo_prefix" | "source_name_match" | "none";
};

/**
 * Puro / testável: deriva o product_slug a partir de um lead.
 * Ordem: resource_id → source "demo:<slug>" → nome de produto no source.
 * Nunca devolve "geral" como slug ativo — trata como fallback.
 */
export function deriveProductSlugFromLead(lead: LeadForSlugDerivation): SlugDerivationResult {
  if (!lead) return { slug: null, derivedFrom: "none" };

  const fromResource = normalizeProductSlug(lead.resource_id ?? null);
  if (fromResource && fromResource !== "geral") {
    return { slug: fromResource, derivedFrom: "resource_id" };
  }

  if (typeof lead.source === "string" && lead.source.toLowerCase().startsWith("demo:")) {
    const s = normalizeProductSlug(lead.source.slice(5));
    if (s && s !== "geral") return { slug: s, derivedFrom: "source_demo_prefix" };
  }

  if (typeof lead.source === "string") {
    const src = lead.source.toLowerCase();
    const candidates = ["qook", "motivae", "hostify", "pikto", "trackfy", "prosafe360"];
    const hit = candidates.find((c) => src.includes(c));
    if (hit) return { slug: hit, derivedFrom: "source_name_match" };
  }

  return { slug: null, derivedFrom: "none" };
}

export async function buildProductKnowledgeSection(
  supabase: any,
  productSlug?: string | null,
): Promise<string> {
  const slug = normalizeProductSlug(productSlug);
  if (!slug || slug === "geral") {
    if (productSlug) {
      console.log(`[product-knowledge] skip inject (slug=${JSON.stringify(productSlug)} normalized=${slug ?? "null"})`);
    }
    return "";
  }

  let data: any = null;
  try {
    const res = await supabase
      .from("product_knowledge")
      .select("product_name, pitch, pricing, faq, tone, icp, objections, cases, extra, is_active")
      .eq("product_slug", slug)
      .maybeSingle();
    if (res.error) {
      console.warn(`[product-knowledge] db error for slug=${slug}:`, res.error.message);
      return "";
    }
    data = res.data;
  } catch (e) {
    console.warn(`[product-knowledge] fetch threw for slug=${slug}:`, e);
    return "";
  }

  if (!data) {
    console.log(`[product-knowledge] no pack for slug=${slug} — fallback to base prompt`);
    return "";
  }
  if (data.is_active === false) {
    console.log(`[product-knowledge] pack inactive for slug=${slug} — fallback to base prompt`);
    return "";
  }

  const parts: string[] = [];

  if (data.tone) parts.push(`\n**Tom de voz:** ${data.tone}`);
  if (data.icp) parts.push(`\n**Cliente-alvo (ICP):** ${data.icp}`);
  if (data.pitch) parts.push(`\n**Pitch:**\n${data.pitch}`);

  const pricing = data.pricing && typeof data.pricing === "object" && !Array.isArray(data.pricing) ? data.pricing : null;
  if (pricing && Object.keys(pricing).length) {
    parts.push(`\n**Pricing:**\n${JSON.stringify(pricing, null, 2)}`);
  }

  const faq = Array.isArray(data.faq) ? data.faq : [];
  if (faq.length) {
    const rendered = faq.slice(0, 10).map((it: any, i: number) => {
      if (typeof it === "string") return `${i + 1}. ${it}`;
      const q = it?.q ?? it?.question ?? "";
      const a = it?.a ?? it?.answer ?? "";
      return `${i + 1}. P: ${q}\n   R: ${a}`;
    }).join("\n");
    parts.push(`\n**FAQ:**\n${rendered}`);
  }

  const objections = Array.isArray(data.objections) ? data.objections : [];
  if (objections.length) {
    const rendered = objections.slice(0, 10).map((it: any, i: number) => {
      if (typeof it === "string") return `${i + 1}. ${it}`;
      return `${i + 1}. ${it?.objection ?? ""} → ${it?.response ?? ""}`;
    }).join("\n");
    parts.push(`\n**Objeções comuns:**\n${rendered}`);
  }

  const cases = Array.isArray(data.cases) ? data.cases : [];
  if (cases.length) {
    parts.push(`\n**Casos de sucesso:**\n${cases.slice(0, 5).map((c: any) => `- ${typeof c === "string" ? c : (c?.title ?? "") + (c?.summary ? ": " + c.summary : "")}`).join("\n")}`);
  }

  // Se não houver nenhum conteúdo útil no pack, não injeta cabeçalho vazio.
  if (parts.length === 0) {
    console.log(`[product-knowledge] pack for slug=${slug} is empty — fallback to base prompt`);
    return "";
  }

  const header = `\n\n## Contexto do produto — ${data.product_name ?? slug}\n(Foca a conversa neste produto. Só muda se o cliente pedir explicitamente outro.)`;
  return header + parts.join("");
}

/**
 * Secção neutra usada quando não há product_slug válido.
 * Não repete nem contradiz o system_prompt base — apenas instrui o modelo
 * a manter-se genérico e a não inventar detalhes de produtos.
 */
export const NEUTRAL_PRODUCT_FALLBACK_SECTION =
  "\n\n## Contexto do produto — não definido\n" +
  "(Não há um produto específico atribuído a esta conversa. " +
  "Responde de forma genérica sobre a GetBoost e os seus serviços. " +
  "Não inventes preços, features nem casos de produtos específicos. " +
  "Se o cliente pedir detalhes de um produto, pergunta qual antes de avançar.)";

/**
 * Wrapper conveniente: devolve sempre uma string a concatenar ao system_prompt.
 * - Se houver pack válido → devolve a secção do produto.
 * - Caso contrário → devolve `NEUTRAL_PRODUCT_FALLBACK_SECTION` (nunca vazio),
 *   garantindo uma resposta consistente sem degradar o prompt base.
 */
export async function buildProductKnowledgeSectionOrFallback(
  supabase: any,
  productSlug?: string | null,
): Promise<string> {
  const section = await buildProductKnowledgeSection(supabase, productSlug);
  if (section) return section;
  console.log(`[product-knowledge] using neutral fallback (slug=${productSlug ?? "null"})`);
  return NEUTRAL_PRODUCT_FALLBACK_SECTION;
}
