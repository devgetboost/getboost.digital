/**
 * Standardised pre-filled WhatsApp messages per CTA.
 *
 * Objectives:
 * - Consistent tone (PT-PT, informal, directo).
 * - Contexto explícito da origem → reduz "olá?" e acelera resposta.
 * - Pergunta implícita/CTA no fim → maximiza taxa de resposta.
 *
 * Sempre usar através de `buildWhatsAppUrl(PHONE, WHATSAPP_MESSAGES.<key>(...))`
 * para que as UTMs de origem sejam automaticamente anexadas.
 */

export const WHATSAPP_PHONE = '351963574400';

export const WHATSAPP_MESSAGES = {
  /** CTA genérico "WhatsApp directo" (hero/canais da página Contacto) */
  generic: () =>
    'Olá Getboost! Gostaria de falar sobre um projecto. Podem ajudar-me?',

  /** ChatWidget — utilizador já deixou nome */
  chatWidget: (name: string) =>
    `Olá Getboost, o meu nome é ${name.trim()}. Gostaria de mais informações sobre os vossos serviços.`,

  /** Calculadora de drone — envia plano, morada, distância e estimativa */
  droneCalculator: (params: {
    plan: 'base' | 'edited' | null;
    address: string;
    distanceKm: number | null;
    priceEur: number | null;
  }) => {
    const planLabel = params.plan === 'base' ? 'Sem Edição' : 'Com Edição';
    const price =
      params.priceEur !== null ? `${params.priceEur.toFixed(2)}€` : 'a confirmar';
    return [
      'Olá Getboost! Vim através da calculadora de drone e gostaria de reservar uma sessão.',
      '',
      `• Plano: ${planLabel}`,
      `• Local: ${params.address || 'a definir'}`,
      `• Distância estimada: ${params.distanceKm ?? '—'} km`,
      `• Valor estimado: ${price}`,
      '',
      'Podem confirmar disponibilidade?',
    ].join('\n');
  },

  /** Página de serviço / solução */
  service: (serviceName: string) =>
    `Olá Getboost! Tenho interesse no serviço "${serviceName}" e gostaria de perceber como funciona para o meu caso. Podem enviar mais detalhes?`,

  /** Página de recurso / lead magnet */
  resource: (resourceTitle: string) =>
    `Olá Getboost! Descarreguei o recurso "${resourceTitle}" e gostaria de tirar algumas dúvidas. Podem ajudar?`,

  /** Diagnóstico gratuito de 30 min */
  diagnosis: () =>
    'Olá Getboost! Quero marcar o diagnóstico gratuito de 30 min. Quais os próximos horários disponíveis?',
} as const;

export type WhatsAppCTAKey = keyof typeof WHATSAPP_MESSAGES;
