// Biblioteca extensa de modelos de mensagem WhatsApp prontos a importar
export type TriggerEvent =
  | "meeting_scheduled"
  | "lead_created"
  | "lead_tagged"
  | "meeting_reminder"
  | "meeting_completed"
  | "custom";

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  trigger_event: TriggerEvent;
  content: string;
  tone: "formal" | "amigável" | "comercial" | "urgente" | "follow-up";
  description: string;
}

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "agendamento", label: "Agendamento" },
  { id: "lembrete", label: "Lembretes" },
  { id: "lead", label: "Captação de leads" },
  { id: "follow-up", label: "Follow-up" },
  { id: "vendas", label: "Vendas & Propostas" },
  { id: "onboarding", label: "Onboarding" },
  { id: "suporte", label: "Suporte" },
  { id: "feedback", label: "Feedback & NPS" },
  { id: "reativacao", label: "Reactivação" },
  { id: "marketing", label: "Marketing & Promo" },
];

export const TEMPLATE_LIBRARY: TemplatePreset[] = [
  // ─── AGENDAMENTO ───────────────────────────────────────────────
  {
    id: "agd-1", name: "Confirmação de reunião (formal)", category: "agendamento",
    trigger_event: "meeting_scheduled", tone: "formal",
    description: "Confirma reunião agendada com tom profissional",
    content:
`Olá {{nome}}, 👋

Reunião confirmada para *{{meeting_date}}* às *{{meeting_time}}* (hora de Lisboa).

📎 Link: {{meeting_link}}

Até já,
Getboost Digital`,
  },
  {
    id: "agd-2", name: "Confirmação amigável", category: "agendamento",
    trigger_event: "meeting_scheduled", tone: "amigável",
    description: "Confirmação descontraída com call to action",
    content:
`Boa, {{nome}}! 🎉

A nossa conversa fica marcada para {{meeting_date}} às {{meeting_time}}.
Vai correr muito bem — leva apenas 30 minutos.

🔗 {{meeting_link}}

Se precisares de reagendar, é só responder a esta mensagem.`,
  },
  {
    id: "agd-3", name: "Confirmação com agenda detalhada", category: "agendamento",
    trigger_event: "meeting_scheduled", tone: "formal",
    description: "Inclui agenda da reunião e preparação",
    content:
`Olá {{nome}},

A tua reunião com o Getboost Digital está confirmada:
🗓 {{meeting_date}}  ⏰ {{meeting_time}}
🏢 {{empresa}}

*Agenda (30 min):*
• 5 min – Contexto do teu projecto
• 15 min – Diagnóstico e oportunidades
• 10 min – Próximos passos

🔗 Link da reunião: {{meeting_link}}

Vê o site antes para acelerar a conversa: https://getboost.digital`,
  },
  {
    id: "agd-4", name: "Reagendamento solicitado", category: "agendamento",
    trigger_event: "custom", tone: "amigável",
    description: "Resposta quando o cliente pede para reagendar",
    content:
`Olá {{nome}}, sem problema!

Podemos remarcar para outro horário. Aqui estão algumas opções:
👉 https://getboost.digital/booking

Escolhe o slot que melhor encaixa e voltamos a confirmar.`,
  },

  // ─── LEMBRETES ─────────────────────────────────────────────────
  {
    id: "lem-1", name: "Lembrete 24h antes", category: "lembrete",
    trigger_event: "meeting_reminder", tone: "amigável",
    description: "Lembrete enviado um dia antes da reunião",
    content:
`Olá {{nome}}! 👋

Só a lembrar que temos reunião *amanhã* ({{meeting_date}}) às *{{meeting_time}}*.

🔗 {{meeting_link}}

Vais precisar apenas de uns 30 min e bom Wi-Fi. Até breve!`,
  },
  {
    id: "lem-2", name: "Lembrete 1h antes", category: "lembrete",
    trigger_event: "custom", tone: "urgente",
    description: "Aviso curto 1h antes da reunião",
    content:
`⏰ {{nome}}, a nossa reunião começa daqui a 1 hora ({{meeting_time}}).

Entra aqui quando estiveres pronto: {{meeting_link}}`,
  },
  {
    id: "lem-3", name: "Lembrete 15 min antes", category: "lembrete",
    trigger_event: "custom", tone: "urgente",
    description: "Aviso final mesmo antes da reunião começar",
    content:
`🔔 {{nome}}, vamos começar em 15 minutos!

Junta-te aqui: {{meeting_link}}

Se houver imprevisto, é só dizer.`,
  },
  {
    id: "lem-4", name: "Lembrete tarefa pendente", category: "lembrete",
    trigger_event: "custom", tone: "amigável",
    description: "Lembra cliente de tarefa/documento pendente",
    content:
`Olá {{nome}}! 📋

Ainda estou à espera dos materiais que combinámos para avançar com o teu projecto.

Quando tiveres 5 min, envia para que possamos continuar.

Obrigado!`,
  },

  // ─── CAPTAÇÃO DE LEADS ─────────────────────────────────────────
  {
    id: "lead-1", name: "Boas-vindas a novo lead (geral)", category: "lead",
    trigger_event: "lead_created", tone: "amigável",
    description: "Primeira mensagem após preenchimento do formulário",
    content:
`Olá {{nome}}! 👋

Recebi o teu contacto sobre *{{servico}}* — obrigado!

Em 24h envio uma proposta inicial. Entretanto, se quiseres acelerar, podemos marcar 15 min:
👉 https://getboost.digital/booking

Getboost Digital`,
  },
  {
    id: "lead-2", name: "Lead Google Ads", category: "lead",
    trigger_event: "lead_tagged", tone: "comercial",
    description: "Resposta personalizada para leads vindos do Google Ads",
    content:
`Olá {{nome}}, viste o nosso anúncio no Google e entraste em contacto — bom timing! 🚀

Trabalhamos com empresas como a {{empresa}} para aumentar resultados de marketing digital em 30-90 dias.

Posso ligar amanhã para perceber o teu caso?
Marca aqui: https://getboost.digital/booking`,
  },
  {
    id: "lead-3", name: "Lead Facebook/Instagram", category: "lead",
    trigger_event: "lead_tagged", tone: "amigável",
    description: "Resposta para leads de redes sociais",
    content:
`Olá {{nome}}! 📱

Vi que vieste do Instagram — obrigado pelo interesse!

Conta-me um pouco mais sobre {{empresa}} e o que andas a tentar resolver. Respondo ainda hoje.`,
  },
  {
    id: "lead-4", name: "Lead recurso descarregado", category: "lead",
    trigger_event: "lead_tagged", tone: "amigável",
    description: "Envia depois de descarregar um e-book ou guia",
    content:
`Olá {{nome}}! 📘

Espero que o material seja útil. Se tiveres dúvidas ou quiseres aplicar ao caso da {{empresa}}, marca 7 min comigo:

👉 https://getboost.digital/booking

Bom trabalho!`,
  },
  {
    id: "lead-5", name: "Lead calculadora ROI", category: "lead",
    trigger_event: "lead_tagged", tone: "comercial",
    description: "Após uso da calculadora de ROI",
    content:
`Olá {{nome}}, vi que calculaste o ROI da {{empresa}} 📊

Posso ajudar a transformar esses números em realidade. Tenho 3 slots livres esta semana para uma conversa rápida:

https://getboost.digital/booking`,
  },

  // ─── FOLLOW-UP ────────────────────────────────────────────────
  {
    id: "fu-1", name: "Follow-up pós-reunião", category: "follow-up",
    trigger_event: "meeting_completed", tone: "follow-up",
    description: "Enviado logo após a reunião terminar",
    content:
`Olá {{nome}}!

Obrigado pela conversa de hoje. Aqui está o resumo:
✅ Próximo passo: enviar proposta detalhada até sexta
✅ Materiais a partilhar: brief + acessos
✅ Dúvidas: respondemos por aqui

Qualquer coisa, é só responder a esta mensagem.`,
  },
  {
    id: "fu-2", name: "Follow-up 3 dias sem resposta", category: "follow-up",
    trigger_event: "custom", tone: "follow-up",
    description: "Toque suave quando proposta não tem resposta",
    content:
`Olá {{nome}}, tudo bem?

Só a confirmar se recebeste a proposta enviada na semana passada. Faz sentido falarmos esta semana para tirar dúvidas?`,
  },
  {
    id: "fu-3", name: "Follow-up 7 dias sem resposta", category: "follow-up",
    trigger_event: "custom", tone: "follow-up",
    description: "Segundo follow-up mais directo",
    content:
`Olá {{nome}},

Não quero ser inconveniente, mas a proposta da {{empresa}} está em aberto há uma semana.

Há algo que possa esclarecer? Ou preferes que volte a contactar dentro de 30 dias?`,
  },
  {
    id: "fu-4", name: "Follow-up de despedida (break-up)", category: "follow-up",
    trigger_event: "custom", tone: "follow-up",
    description: "Último contacto antes de fechar lead",
    content:
`Olá {{nome}},

Vou assumir que este não é o melhor momento para avançarmos. Sem problema!

Se as prioridades mudarem, sabes onde estou:
📧 hello@getboost.digital
🔗 https://getboost.digital

Boa sorte com o projecto da {{empresa}}!`,
  },

  // ─── VENDAS & PROPOSTAS ───────────────────────────────────────
  {
    id: "ven-1", name: "Envio de proposta", category: "vendas",
    trigger_event: "custom", tone: "comercial",
    description: "Notifica que a proposta foi enviada por email",
    content:
`{{nome}}, proposta enviada! 📩

Verifica o teu email ({{email}}). Inclui escopo, timeline e investimento.

Disponível para responder a dúvidas por aqui ou em chamada.`,
  },
  {
    id: "ven-2", name: "Desconto limitado", category: "vendas",
    trigger_event: "custom", tone: "urgente",
    description: "Oferta com prazo para criar urgência",
    content:
`Olá {{nome}}! ⏳

Para fechares ainda este mês, aplico *10% de desconto* na proposta da {{empresa}}.
Oferta válida até sexta-feira.

Confirmamos?`,
  },
  {
    id: "ven-3", name: "Proposta aceite — próximos passos", category: "vendas",
    trigger_event: "custom", tone: "formal",
    description: "Confirmação após aceitação da proposta",
    content:
`{{nome}}, excelente! 🎉

Proposta aceite. Próximos passos:
1️⃣ Envio do contrato por email
2️⃣ Reunião de kickoff (marcar)
3️⃣ Início dos trabalhos

Vou agendar o kickoff já a seguir. Bem-vinda/o à equipa!`,
  },
  {
    id: "ven-4", name: "Negociação — reforço de valor", category: "vendas",
    trigger_event: "custom", tone: "comercial",
    description: "Resposta a objeções de preço",
    content:
`{{nome}}, percebo a preocupação com o investimento.

Vale a pena olharmos para o ROI esperado: clientes como a {{empresa}} normalmente recuperam o valor em 3-4 meses.

Posso preparar uma versão faseada da proposta?`,
  },

  // ─── ONBOARDING ───────────────────────────────────────────────
  {
    id: "onb-1", name: "Boas-vindas novo cliente", category: "onboarding",
    trigger_event: "custom", tone: "amigável",
    description: "Primeira mensagem após contrato assinado",
    content:
`🎉 Bem-vindo/a, {{nome}}!

A partir de agora és cliente do Getboost Digital Studio. Nos próximos dias vais receber:
📋 Acessos à plataforma
🗓 Convite para kickoff
📑 Brief para preencher

Qualquer dúvida, responde por aqui.`,
  },
  {
    id: "onb-2", name: "Convite kickoff", category: "onboarding",
    trigger_event: "custom", tone: "formal",
    description: "Marca reunião de arranque do projecto",
    content:
`Olá {{nome}}!

Está na hora do nosso kickoff 🚀
Marca aqui o melhor horário para a {{empresa}}: https://getboost.digital/booking

Vamos alinhar objectivos, prazos e responsabilidades.`,
  },
  {
    id: "onb-3", name: "Pedido de acessos", category: "onboarding",
    trigger_event: "custom", tone: "formal",
    description: "Solicita acessos necessários para começar",
    content:
`Olá {{nome}}, para arrancarmos vou precisar de:

🔑 Acesso ao Google Analytics
🔑 Acesso ao site (admin)
🔑 Acesso ao Meta Business
🔑 Acesso ao Google Ads (se aplicável)

Envia tudo para hello@getboost.digital. Obrigado!`,
  },

  // ─── SUPORTE ──────────────────────────────────────────────────
  {
    id: "sup-1", name: "Ticket recebido", category: "suporte",
    trigger_event: "custom", tone: "formal",
    description: "Confirma receção de pedido de suporte",
    content:
`Olá {{nome}}, recebi o teu pedido ✅

Respondo em até 4h úteis. Para urgências, marca aqui:
👉 https://getboost.digital/booking`,
  },
  {
    id: "sup-2", name: "Resolução de ticket", category: "suporte",
    trigger_event: "custom", tone: "formal",
    description: "Confirma resolução de incidente",
    content:
`{{nome}}, o problema foi resolvido ✅

Verifica do teu lado e confirma. Se voltar a acontecer, abre novo pedido.

Obrigado pela paciência!`,
  },
  {
    id: "sup-3", name: "Confirmação de presença evento", category: "suporte",
    trigger_event: "custom", tone: "amigável",
    description: "Pede confirmação de presença",
    content:
`Olá {{nome}}! 

Podes confirmar a tua presença em *{{meeting_date}}* às *{{meeting_time}}*?
Responde com ✅ Sim ou ❌ Não consigo.

Obrigado!`,
  },

  // ─── FEEDBACK & NPS ───────────────────────────────────────────
  {
    id: "fb-1", name: "Pedido de feedback (NPS)", category: "feedback",
    trigger_event: "meeting_completed", tone: "amigável",
    description: "Avaliação pós-reunião com escala 0-10",
    content:
`Olá {{nome}}! 

Numa escala de 0 a 10, quanto recomendarias o Getboost Digital Studio a um colega?

A tua resposta ajuda muito a melhorar. Obrigado! 🙏`,
  },
  {
    id: "fb-2", name: "Pedido de testemunho", category: "feedback",
    trigger_event: "custom", tone: "amigável",
    description: "Solicita depoimento após projecto bem-sucedido",
    content:
`{{nome}}, foi um prazer trabalhar com a {{empresa}}! 🚀

Importas-te de partilhar um pequeno testemunho em 2-3 frases sobre a experiência?

Isso ajuda outras empresas a tomar decisão. Obrigado!`,
  },
  {
    id: "fb-3", name: "Pedido de review Google", category: "feedback",
    trigger_event: "custom", tone: "amigável",
    description: "Pede avaliação no Google",
    content:
`{{nome}}, se a experiência foi positiva, ajudas-me com uma review no Google? ⭐

👉 https://g.page/r/getboostdigital/review

Demora 30 segundos e faz toda a diferença. Obrigado!`,
  },

  // ─── REACTIVAÇÃO ──────────────────────────────────────────────
  {
    id: "rea-1", name: "Cliente inactivo 30 dias", category: "reativacao",
    trigger_event: "custom", tone: "follow-up",
    description: "Tentativa de reactivar cliente há 30 dias sem contacto",
    content:
`Olá {{nome}}, há quase um mês que não falamos! 👋

Como está a correr a {{empresa}}? Posso ajudar nalguma coisa nova?`,
  },
  {
    id: "rea-2", name: "Lead frio — 90 dias", category: "reativacao",
    trigger_event: "custom", tone: "comercial",
    description: "Reactivação de lead há 3 meses",
    content:
`Olá {{nome}},

Faz hoje 3 meses desde o nosso último contacto. As coisas mudam rápido — faz sentido falarmos novamente?

Marca 15 min aqui: https://getboost.digital/booking`,
  },
  {
    id: "rea-3", name: "Oferta de auditoria gratuita", category: "reativacao",
    trigger_event: "custom", tone: "comercial",
    description: "Reactiva com proposta de valor (auditoria grátis)",
    content:
`{{nome}}, este mês estou a oferecer 5 auditorias gratuitas de marketing digital.

A {{empresa}} interessa? Sem compromisso — em 30 min identifico 3 oportunidades concretas.

👉 https://getboost.digital/booking`,
  },

  // ─── MARKETING & PROMO ────────────────────────────────────────
  {
    id: "mkt-1", name: "Anúncio novo serviço", category: "marketing",
    trigger_event: "custom", tone: "amigável",
    description: "Comunica lançamento de novo serviço",
    content:
`🆕 Novidade {{nome}}!

Lançámos um novo serviço de *Automação com IA* para empresas como a {{empresa}}.

Sabe mais aqui: https://getboost.digital/services

Queres ver se faz sentido para o teu caso?`,
  },
  {
    id: "mkt-2", name: "Convite webinar", category: "marketing",
    trigger_event: "custom", tone: "amigável",
    description: "Convite para evento online",
    content:
`Olá {{nome}}! 🎥

Estou a organizar um webinar gratuito: *"Como triplicar os teus leads em 90 dias"*
🗓 {{meeting_date}}  ⏰ {{meeting_time}}

Inscrição (vagas limitadas): https://getboost.digital/booking

Vou contar com a tua presença?`,
  },
  {
    id: "mkt-3", name: "Newsletter / artigo novo", category: "marketing",
    trigger_event: "custom", tone: "amigável",
    description: "Partilha conteúdo do blog",
    content:
`📖 {{nome}}, artigo novo no blog:

*"5 erros que estão a queimar o teu orçamento de Ads"*

Leitura de 4 min: https://getboost.digital/blog

Diz-me o que achaste!`,
  },
  {
    id: "mkt-4", name: "Campanha Black Friday", category: "marketing",
    trigger_event: "custom", tone: "urgente",
    description: "Promoção sazonal com urgência",
    content:
`🔥 BLACK FRIDAY {{nome}}!

*-30%* em todos os serviços de marketing digital até dia 30.
Vagas limitadas: apenas 8 projectos novos este mês.

Reserva o teu slot: https://getboost.digital/booking`,
  },
  {
    id: "mkt-5", name: "Mensagem de Natal", category: "marketing",
    trigger_event: "custom", tone: "amigável",
    description: "Cumprimento de fim de ano",
    content:
`🎄 {{nome}}, um Feliz Natal para ti e para toda a equipa da {{empresa}}!

Que 2026 traga ainda mais conquistas. Obrigado pela confiança.

Getboost Digital`,
  },
];
