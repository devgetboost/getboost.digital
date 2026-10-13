import { PILLARS, type PillarId } from '@/components/pillars/pillarData';
import { PRODUCTS } from './products';

/**
 * R20.7 — Case Study Framework (official).
 *
 * Contexto → Desafio → Diagnóstico → Solução → Implementação →
 * Resultado → Próximos Passos. Each stage names the Clean V1
 * `CaseStudyView` fields that feed it; stages without data do not
 * render. Nothing here invents content — it only structures what the
 * CMS already carries.
 */

export interface FrameworkStage {
  id: string;
  label: string;
  /** CaseStudyView keys consumed by this stage (informational contract). */
  fields: string[];
}

export const CASE_FRAMEWORK: FrameworkStage[] = [
  { id: 'contexto', label: 'Contexto', fields: ['clientName', 'industry', 'publishedAt'] },
  { id: 'desafio', label: 'Desafio', fields: ['challenge'] },
  { id: 'diagnostico', label: 'Diagnóstico', fields: ['strategy'] },
  { id: 'solucao', label: 'Solução', fields: ['solution'] },
  { id: 'implementacao', label: 'Implementação', fields: ['capabilities', 'technologies'] },
  { id: 'resultado', label: 'Resultado', fields: ['results'] },
  { id: 'proximos-passos', label: 'Próximos Passos', fields: [] },
];

/** Renders the CMS `results` field (unknown shape) as display strings. Never invents. */
export const renderableResults = (results: unknown): string[] => {
  if (typeof results === 'string') return results.trim() ? [results.trim()] : [];
  if (Array.isArray(results)) {
    return results.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  return [];
};

/** Non-empty text or null (conditional sections render only with data). */
export const presentText = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Product → pillars reverse map, DERIVED from the approved pillar dataset
 * (pillarData lists products per pillar). Used to link proof surfaces
 * without inventing relationships.
 */
export const productPillars = (productSlug: string): PillarId[] => {
  const out: PillarId[] = [];
  for (const pillar of Object.values(PILLARS)) {
    if (pillar.products.includes(productSlug)) out.push(pillar.id);
  }
  return out;
};

/** Pillar landing route for proof cross-links. */
export const pillarRoute = (pillar: PillarId): string => PILLARS[pillar].route;

/** Catalog product slugs (proof link targets must resolve). */
export const catalogSlugs = (): string[] => PRODUCTS.filter((p) => p.to).map((p) => p.slug);

/**
 * Product match for a case client name. Only an EXACT (accent/case
 * insensitive) hit on a catalog product name counts — otherwise null, so a
 * proof link is never invented for an unrelated client.
 */
export const productForClient = (clientName: string | null | undefined) => {
  if (!clientName) return null;
  const normalize = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const target = normalize(clientName);
  if (target.length === 0) return null;
  return PRODUCTS.find((product) => normalize(product.name) === target) ?? null;
};

// ---------------------------------------------------------------------------
// Contextual assessment mapping (R20.7 Phase 11)
// ---------------------------------------------------------------------------

/** The four pillar engines + the neutral default (all ids exist in R20.4). */
export const ASSESSMENT_FALLBACK = 'operations-score';

export const PILLAR_ASSESSMENT: Record<PillarId, string> = {
  ai: 'ai-readiness',
  automation: 'automation-audit',
  software: 'software-readiness',
  growth: 'growth-score',
};

/**
 * Keyword evidence per pillar, matched against the case's OWN capabilities
 * and technologies (the only execution evidence the CMS carries). Matching
 * is deterministic: pillars are probed in fixed order and the first hit
 * wins; no match falls back to the neutral operations score. Short tokens
 * ("ia", "ai") only match as whole words so "fotografia" never reads as AI.
 * This is a heuristic, not a claim — documented in
 * docs/case-studies-premium.md.
 */
export const PILLAR_KEYWORDS: Record<PillarId, string[]> = {
  ai: ['ia', 'ai', 'agents', 'agent', 'llm', 'chatbot', 'assistente', 'prompt'],
  automation: [
    'automa', 'integra', 'workflow', 'n8n', 'whatsapp', 'crm', 'erp',
    'sync', 'sincron', 'api', 'pipeline',
  ],
  software: ['software', 'saas', 'plataforma', 'aplicacao', 'app', 'web', 'frontend', 'backend', 'base de dados', 'mobile'],
  growth: ['growth', 'seo', 'conteudo', 'campanha', 'ads', 'social', 'marketing', 'posicionamento', 'narrativa', 'landing'],
};

const PILLAR_ORDER: PillarId[] = ['ai', 'automation', 'software', 'growth'];

const tokenize = (value: string): string[] =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((word) => word.length > 0);

/** Short tokens must match a whole word; longer ones match inside a word. */
const matchesKeyword = (words: string[], keyword: string): boolean =>
  keyword.length <= 3 ? words.includes(keyword) : words.some((word) => word.includes(keyword));

/**
 * Best-effort assessment id for a case. Returns the fallback when the case
 * carries no recognizable execution evidence — never a wrong pillar by
 * invention, always one of the five real engines.
 */
export const assessmentForCase = (capabilities: string[], technologies: string[]): string => {
  const words = tokenize([...capabilities, ...technologies].join(' · '));
  if (words.length === 0) return ASSESSMENT_FALLBACK;
  for (const pillar of PILLAR_ORDER) {
    if (PILLAR_KEYWORDS[pillar].some((keyword) => matchesKeyword(words, keyword))) {
      return PILLAR_ASSESSMENT[pillar];
    }
  }
  return ASSESSMENT_FALLBACK;
};

/** Pillar whose engine a case maps to (null → neutral operations score). */
export const pillarForCase = (capabilities: string[], technologies: string[]): PillarId | null => {
  const assessment = assessmentForCase(capabilities, technologies);
  const match = PILLAR_ORDER.find((pillar) => PILLAR_ASSESSMENT[pillar] === assessment);
  return match ?? null;
};

