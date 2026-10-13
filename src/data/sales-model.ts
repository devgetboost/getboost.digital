import { PRODUCTS } from './products';
import { getProductNetwork } from './product-demand';
import type { ProductDossier } from './product-demand';
import { getProductDossiers, getProductLandingAudit } from './product-demand';

/**
 * R20.10 — AI Sales Layer · model and playbooks (Fases 1, 11, 12).
 *
 * Despite the release name there is NO artificial intelligence in this
 * layer: no model, no inference, no external provider. "AI" here means an
 * explicit, auditable decision engine over facts the platform already
 * observed. Every recommendation carries the rule that fired and the signals
 * it read — nothing is opaque, nothing executes.
 */

// ---------------------------------------------------------------------------
// Fase 1 — official sales model
// ---------------------------------------------------------------------------

/** Lead → Qualified → Opportunity → Sales Action → Pipeline Stage. */
export const SALES_MODEL = [
  'LEAD',
  'QUALIFIED',
  'OPPORTUNITY',
  'SALES_ACTION',
  'PIPELINE_STAGE',
] as const;

export type SalesModelStage = (typeof SALES_MODEL)[number];

/** The four commercial actions. A recommendation, never an execution. */
export type SalesAction = 'BOOK_CALL' | 'SEND_PROPOSAL' | 'NURTURE' | 'WAIT';

export const SALES_ACTIONS: SalesAction[] = ['BOOK_CALL', 'SEND_PROPOSAL', 'NURTURE', 'WAIT'];

/** Fase 4 — opportunity prioritization bands. */
export type SalesPriority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';

export const SALES_PRIORITIES: SalesPriority[] = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW'];

export const PRIORITY_ORDER: Record<SalesPriority, number> = {
  HIGHEST: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ---------------------------------------------------------------------------
// Fase 11 — sales playbook
// ---------------------------------------------------------------------------

export interface SalesPlaybookStep {
  id: string;
  title: string;
  /** What the step is for — guidance, never generated commercial copy. */
  purpose: string;
}

export interface SalesPlaybook {
  action: SalesAction;
  intent: string;
  steps: SalesPlaybookStep[];
  /** Signals that make this playbook the right one. */
  appliesWhen: string[];
  /** Signals that should stop the action and route elsewhere. */
  stopWhen: string[];
}

export const SALES_PLAYBOOKS: Record<SalesAction, SalesPlaybook> = {
  BOOK_CALL: {
    action: 'BOOK_CALL',
    intent: 'Conversão de intenção em conversa',
    appliesWhen: ['Reunião ainda não agendada', 'Intenção comprovada por assessment ou produto'],
    stopWhen: ['Lead já agendou reunião', 'Lead sem qualquer sinal de intenção'],
    steps: [
      { id: 'book_call_1', title: 'Confirmar contexto', purpose: 'Rever o caminho percorrido pelo lead antes de propor hora.' },
      { id: 'book_call_2', title: 'Discussão', purpose: 'Diagnosticar o problema com as perguntas do pilar correspondente.' },
      { id: 'book_call_3', title: 'Próximo passo combinado', purpose: 'Sair com uma decisão e uma data, nunca com um "envio depois".' },
    ],
  },
  SEND_PROPOSAL: {
    action: 'SEND_PROPOSAL',
    intent: 'Converter oportunidade qualificada em oferta',
    appliesWhen: ['Reunião realizada', 'Proposta já preparada após leitura de score, intenção e fit'],
    stopWhen: ['Sem reunião', 'Sem produto definido'],
    steps: [
      { id: 'proposal_1', title: 'Oferta', purpose: 'Propor o âmbito do produto com o fit identificado.' },
      { id: 'proposal_2', title: 'Âmbito e próximos passos', purpose: 'Fixar o que entra, o que não entra, e quando.' },
    ],
  },
  NURTURE: {
    action: 'NURTURE',
    intent: 'Manter o interesse vivo até haver intenção suficiente',
    appliesWhen: ['Interesse demonstrado', 'Intenção insuficiente para reunir'],
    stopWhen: ['Houve reunião', 'O assessment voltou avançado'],
    steps: [
      { id: 'nurture_1', title: 'Conteúdo', purpose: 'Enviar o recurso do insight ligado ao tema do lead visitou.' },
      { id: 'nurture_2', title: 'Reavaliação', purpose: 'Reoferecer o assessment quando o sinal de intenção subir.' },
    ],
  },
  WAIT: {
    action: 'WAIT',
    intent: 'Não gastar esforço comercial em lead sem sinal',
    appliesWhen: ['Sem captura', 'Sem intenção', 'Sem produto'],
    stopWhen: ['Apareceu qualquer sinal de intenção'],
    steps: [
      { id: 'wait_1', title: 'Observação', purpose: 'Manter o lead no radar de demanda sem contacto comercial.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Fase 12 — product playbooks (derived, never authored copy)
// ---------------------------------------------------------------------------

export interface ProductPlaybook {
  slug: string;
  name: string;
  /** Where the conversation starts — the pillar that delivers the product. */
  anchorPillar: string | null;
  /** The assessment that qualifies this product's interest. */
  qualificationEngine: string | null;
  /** Landing route to reference (null for institutional-only products). */
  landing: string | null;
  /** Case study proving the work, when one exists. */
  proofCase: string | null;
  /** Dossier gaps a salesperson must fill before pitching. */
  dossierGaps: string[];
}

/**
 * Every field is derived from existing registries (catalog, pillars, R20.8
 * dossier, R20.9 assessment map, case narratives). Nothing is invented and
 * no commercial copy is generated: the playbook points at real surfaces.
 */
export const buildProductPlaybooks = (
  caseNarratives: { slug: string; to?: string }[] = [],
): ProductPlaybook[] => {
  const network = getProductNetwork(caseNarratives);
  const dossiers = getProductDossiers(getProductLandingAudit(PRODUCTS.filter((p) => p.to).map((p) => p.to as string)));
  return network.map((node) => {
    const dossier = dossiers.find((d) => d.slug === node.slug) as ProductDossier;
    const proofCase =
      node.cases[0] ?? caseNarratives.find((entry) => entry.to?.replace(/^\//, '') === node.slug)?.slug ?? null;
    return {
      slug: node.slug,
      name: node.name,
      anchorPillar: node.pillars[0] ?? null,
      qualificationEngine: node.assessment,
      landing: node.route,
      proofCase,
      dossierGaps: dossier.missingFields,
    };
  });
};
