import { z } from 'zod';

/**
 * Output contracts for each Agentic AI agent.
 * Kept minimal (no .min/.max bounds) so structured-output providers accept them.
 * Business rules (score ranges, string length caps) are enforced in code after parse.
 */

export const LeadQualifierOutput = z.object({
  classification: z.enum(['quente', 'morno', 'frio']),
  justification: z.string(),
  tags: z.array(z.string()),
  nextAction: z.string(),
  score: z.number(),
});
export type LeadQualifierOutputT = z.infer<typeof LeadQualifierOutput>;

export const WhatsAppConciergeOutput = z.object({
  reply: z.string(),
  handoff: z.boolean(),
  handoffCategory: z.enum(['urgency', 'complaint_legal', 'human_request', 'none']).optional(),
});
export type WhatsAppConciergeOutputT = z.infer<typeof WhatsAppConciergeOutput>;

export const BookingAssistantOutput = z.object({
  message: z.string(),
  action: z.enum(['confirm', 'remind', 'reschedule', 'follow_up']),
  includesLink: z.boolean(),
});
export type BookingAssistantOutputT = z.infer<typeof BookingAssistantOutput>;

export const ContentEditorOutput = z.object({
  title: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  outline: z.array(z.string()),
  body: z.string(),
  tags: z.array(z.string()),
  cta: z.string(),
});
export type ContentEditorOutputT = z.infer<typeof ContentEditorOutput>;

export const CampaignStrategistOutput = z.object({
  segment: z.string(),
  estimatedReach: z.number(),
  subjectLines: z.array(z.string()),
  preheader: z.string(),
  firstParagraph: z.string(),
});
export type CampaignStrategistOutputT = z.infer<typeof CampaignStrategistOutput>;

export const AgentSchemas = {
  'Lead Qualifier': LeadQualifierOutput,
  'WhatsApp Concierge': WhatsAppConciergeOutput,
  'Booking Assistant': BookingAssistantOutput,
  'Content Editor': ContentEditorOutput,
  'Campaign Strategist': CampaignStrategistOutput,
} as const;

/** Post-parse business validation (kept OUT of Zod schemas). */
export function validateBusinessRules(agent: keyof typeof AgentSchemas, output: unknown): { ok: true } | { ok: false; error: string } {
  switch (agent) {
    case 'Lead Qualifier': {
      const o = output as LeadQualifierOutputT;
      if (o.score < 0 || o.score > 100) return { ok: false, error: 'score fora de 0-100' };
      if (o.tags.length === 0) return { ok: false, error: 'deve incluir pelo menos 1 tag' };
      return { ok: true };
    }
    case 'WhatsApp Concierge': {
      const o = output as WhatsAppConciergeOutputT;
      if (o.reply.length > 600) return { ok: false, error: 'resposta demasiado longa para WhatsApp' };
      if (o.handoff && (!o.handoffCategory || o.handoffCategory === 'none')) {
        return { ok: false, error: 'handoff=true exige categoria válida' };
      }
      return { ok: true };
    }
    case 'Content Editor': {
      const o = output as ContentEditorOutputT;
      if (o.title.length > 70) return { ok: false, error: 'título > 60 chars recomendado' };
      if (o.metaDescription.length > 170) return { ok: false, error: 'meta description > 160 chars' };
      if (!o.cta.includes('extraordinário')) return { ok: false, error: 'CTA final obrigatório em falta' };
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

/** Anti-PT-BR heuristic — flags common Brazilian Portuguese giveaways. */
export function containsPtBr(text: string): boolean {
  const markers = [/\bvocê\b/i, /\bgente\b/i, /\btelinha\b/i, /\btime\b(?! zone)/i, /\bcelular\b/i, /\ba gente vai\b/i];
  return markers.some((rx) => rx.test(text));
}
