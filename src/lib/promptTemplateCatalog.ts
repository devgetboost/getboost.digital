// Catálogo curado de templates de prompt prontos para importar
// para a Biblioteca de Prompts.
//
// Cada template pode ser adicionado à biblioteca com 1 clique.
// Usa {{variavel}} para placeholders (o editor deteta-os automaticamente).

export type CatalogTemplate = {
  slug: string;
  name: string;
  description: string;
  category: string;
  content: string;
};

export const PROMPT_CATALOG: CatalogTemplate[] = [
  // ─── Concierge / vendas ─────────────────────────────
  {
    slug: "concierge-produto",
    name: "Concierge de produto",
    description: "Assistente comercial que qualifica leads e responde a dúvidas de um produto específico.",
    category: "Comercial",
    content: `És o Concierge da {{empresa}} para o produto {{produto}}.
Objetivo: qualificar o lead e agendar uma demo.

Regras:
- Tom: {{tom}}
- Faz UMA pergunta de cada vez.
- Se o cliente pedir humano, chama a tool escalar_humano.
- Nunca inventes preços — usa apenas o pricing do knowledge pack.

Fluxo:
1. Cumprimenta e identifica a necessidade.
2. Recolhe: nome, empresa, dimensão, caso de uso.
3. Confirma fit e propõe demo (link: {{link_agendamento}}).`,
  },
  {
    slug: "qualificacao-bant",
    name: "Qualificação BANT",
    description: "Qualifica leads por Budget, Authority, Need, Timeline.",
    category: "Comercial",
    content: `Qualifica o lead em BANT.

Para cada dimensão, faz 1 pergunta natural:
- Budget: "Que investimento estão a considerar?"
- Authority: "Além de ti, quem mais decide?"
- Need: "Qual é a dor concreta que querem resolver?"
- Timeline: "Quando querem ter isto a funcionar?"

Devolve JSON: { budget, authority, need, timeline, score (0-100), próximos_passos }`,
  },
  {
    slug: "objecoes-preco",
    name: "Tratamento de objeções — preço",
    description: "Responde a objeções de preço reforçando valor e ROI.",
    category: "Comercial",
    content: `Cliente disse: "{{objecao}}"

1. Valida a preocupação (não descartes).
2. Reformula em termos de ROI ({{beneficio_principal}}).
3. Oferece alternativa (piloto/plano inferior/parcelamento).
4. Fecha com pergunta aberta.

Mantém tom {{tom}}, máximo 4 frases.`,
  },

  // ─── Suporte ─────────────────────────────────────────
  {
    slug: "suporte-triage",
    name: "Triagem de suporte",
    description: "Classifica um pedido de suporte por severidade e área.",
    category: "Suporte",
    content: `Classifica este pedido:
"{{mensagem}}"

Devolve JSON:
{
  "severidade": "baixa|media|alta|critica",
  "area": "faturacao|tecnico|conta|feature_request|outro",
  "resumo": "1 frase",
  "acao_sugerida": "..."
}`,
  },
  {
    slug: "resposta-empatica",
    name: "Resposta empática a reclamação",
    description: "Responde a reclamações com empatia e ação clara.",
    category: "Suporte",
    content: `Reclamação: "{{reclamacao}}"

Estrutura:
1. Reconhece o problema com empatia genuína (sem "lamentamos qualquer inconveniente").
2. Assume responsabilidade concreta.
3. Explica o que vais fazer e quando ({{prazo}}).
4. Pergunta se algo mais.

Tom humano, 4-6 frases, sem jargão corporativo.`,
  },

  // ─── Conteúdo / Marketing ────────────────────────────
  {
    slug: "post-linkedin",
    name: "Post LinkedIn",
    description: "Gera post LinkedIn com hook forte e CTA.",
    category: "Conteúdo",
    content: `Escreve um post LinkedIn sobre {{tema}}.

Estrutura:
- Hook (linha 1): observação contra-intuitiva ou pergunta.
- 3-5 linhas curtas com o insight.
- Exemplo concreto.
- CTA: {{cta}}.

Regras: sem emojis excessivos, sem "hoje em dia...", máximo 900 caracteres.`,
  },

  // ─── Redes Sociais ───────────────────────────────────
  {
    slug: "post-instagram",
    name: "Post Instagram (feed)",
    description: "Legenda de feed com hook visual, storytelling curto e CTA para DM/stories.",
    category: "Redes Sociais",
    content: `Escreve uma legenda de Instagram (feed) sobre {{tema}} para {{marca}}.

Estrutura:
- Linha 1: hook curto (máx 8 palavras) que pare o scroll.
- 3-6 linhas com storytelling ou insight (frases curtas, quebras de linha).
- 1 mini-lição ou dado concreto.
- CTA: {{cta}} (ex: "comenta X", "guarda este post", "DM 'quero'").
- 5 a 10 hashtags relevantes no fim (mistura nicho + amplas).

Regras: máx 2200 caracteres, tom {{tom}}, sem markdown, sem links no meio (Instagram não os torna clicáveis).`,
  },
  {
    slug: "reels-tiktok-script",
    name: "Script Reels / TikTok",
    description: "Script curto (15-45s) com gancho nos 3s, estrutura hook→valor→CTA e sugestões de B-roll.",
    category: "Redes Sociais",
    content: `Cria um script de {{duracao_segundos}}s para Reels/TikTok sobre {{tema}}.

Devolve tabela markdown com colunas: Tempo | Fala (voz off) | Texto on-screen | B-roll / ação.

Regras:
- 0-3s: hook forte (pergunta, contradição ou promessa). Sem "olá, tudo bem".
- Meio: 2-3 pontos-chave, ritmo rápido, 1 ideia por corte.
- Últimos 3s: CTA claro ({{cta}}) + loop visual se possível.
- Sugere 5 hashtags de tendência e 3 de nicho.
- Sugere som/trend se relevante.

Tom: {{tom}}. Público-alvo: {{icp}}.`,
  },
  {
    slug: "post-facebook",
    name: "Post Facebook",
    description: "Post conversacional para maximizar comentários e alcance orgânico.",
    category: "Redes Sociais",
    content: `Escreve um post de Facebook sobre {{tema}} para {{marca}}.

Estrutura:
- Abertura conversacional (1-2 frases) que crie identificação.
- Desenvolvimento em 3-6 linhas curtas, tom próximo.
- Pergunta aberta no fim para gerar comentários.
- Link (se houver) na 1ª linha ou no fim: {{link}}.

Regras: máx 400 palavras, sem hashtags excessivas (0-3), sem jargão. Emojis com moderação (0-3).`,
  },
  {
    slug: "youtube-titulo-descricao",
    name: "YouTube — título, descrição e capítulos",
    description: "SEO on-page para vídeo YouTube: título com keyword, descrição 150 palavras, capítulos e tags.",
    category: "Redes Sociais",
    content: `Vídeo YouTube sobre {{tema}}. Keyword principal: {{keyword}}.

Devolve JSON:
{
  "titulo": "máx 60 caracteres, keyword no início, promessa clara",
  "descricao": "150 palavras: 1ª frase repete keyword + benefício; parágrafo 2 detalha o que se aprende; parágrafo 3 CTA + links",
  "capitulos": [{"tempo": "00:00", "titulo": "..."}],
  "tags": ["8 a 12 tags"],
  "thumbnail_hook": "3-5 palavras para arte da thumbnail"
}

Regras: não inventes timestamps se não houver info; usa placeholders {{tempo}}.`,
  },
  {
    slug: "youtube-shorts-script",
    name: "Script YouTube Shorts",
    description: "Short vertical 30-60s com hook, payoff e loop final.",
    category: "Redes Sociais",
    content: `Short YouTube (máx 60s) sobre {{tema}}.

Estrutura:
- 0-2s: hook (promessa ou pergunta chocante).
- 3-45s: 3 beats de valor, um por corte.
- 46-60s: payoff + loop (última frase liga à primeira).

Devolve:
1. Script (voz off + texto on-screen).
2. Título (< 40 caracteres, com keyword {{keyword}}).
3. Descrição curta + 3 hashtags.`,
  },
  {
    slug: "repurpose-multi-rede",
    name: "Repurpose multi-rede",
    description: "Adapta 1 conteúdo base para IG, Facebook, LinkedIn, TikTok e YouTube Shorts.",
    category: "Redes Sociais",
    content: `Conteúdo base:
"""
{{conteudo_base}}
"""

Marca: {{marca}} · Tom: {{tom}} · CTA: {{cta}}

Adapta para cada rede respeitando as suas boas práticas. Devolve JSON:
{
  "instagram_feed": "legenda + hashtags",
  "instagram_stories": "3 slides curtos com ideia por slide",
  "facebook": "post conversacional com pergunta final",
  "linkedin": "hook + 4-6 linhas + CTA, tom profissional",
  "tiktok_reels": "script 30s com hook nos 3s",
  "youtube_shorts": "script 45s com título e descrição",
  "x_thread": "5-7 tweets numerados"
}

Mantém a mensagem central; ajusta tamanho, tom e formato à rede.`,
  },
  {
    slug: "calendario-editorial-semanal",
    name: "Calendário editorial semanal",
    description: "Plano de 7 dias × redes com formatos variados por pilar de conteúdo.",
    category: "Redes Sociais",
    content: `Cria um calendário editorial de 7 dias para {{marca}}.
Tema do mês: {{tema_mes}} · Produto/serviço: {{produto}} · ICP: {{icp}}
Redes ativas: {{redes}} (ex: instagram, tiktok, linkedin, youtube).

Devolve tabela markdown: Dia | Rede | Formato | Pilar | Ideia | Hook | CTA.

Regras:
- Alterna pilares: educativo, prova social, bastidores, produto, entretenimento.
- Não repitas formato 2 dias seguidos na mesma rede.
- Marca 1 conteúdo "âncora" por semana (Reel ou Short mais trabalhado).`,
  },
  {
    slug: "ideias-conteudo-pilar",
    name: "Ideias de conteúdo por pilar",
    description: "Gera 20 ideias de conteúdo a partir de um pilar e ICP.",
    category: "Redes Sociais",
    content: `Pilar: {{pilar}} · ICP: {{icp}} · Marca: {{marca}}

Gera 20 ideias de conteúdo, numeradas. Para cada uma:
- Formato sugerido (Reel, carrossel, Short, post texto, live...).
- Hook em 1 frase.
- Angle (educativo, contra-intuitivo, storytelling, prova social, tutorial).

Evita clichés ("hoje em dia...", "sabias que..."). Diversifica formatos.`,
  },
  {
    slug: "social-media-manager-system",
    name: "Agente — Social Media Manager (system prompt)",
    description: "System prompt para criar um agente que gere IG, Facebook, LinkedIn, TikTok e YouTube.",
    category: "Redes Sociais",
    content: `És o Social Media Manager da {{marca}}.

Objetivo: planear, criar e otimizar conteúdo para {{redes}} de forma consistente com a brand voice e ICP.

Brand voice:
- Tom: {{tom}}
- Faz: {{do}}
- Não faz: {{dont}}
- ICP: {{icp}}
- Produto/serviço principal: {{produto}}

Regras absolutas:
- Nunca inventes preços, features ou casos de sucesso — pede-os se não os tiveres.
- Respeita limites por rede: IG feed 2200 car., X 280 car., LinkedIn 3000 car., TikTok legendas 150 car.
- Máx 10 hashtags no Instagram, 0-3 no LinkedIn/Facebook, mistura nicho + amplas no TikTok.
- Pede sempre aprovação humana antes de "publicar" (usa a tool aprovar_conteudo).
- Adapta o mesmo conteúdo a cada rede em vez de copiar-colar.

Capacidades (tools que deves usar quando faz sentido):
- gerar_post(rede, tema, cta) — cria post nativo para a rede.
- repurpose(conteudo_base, redes[]) — adapta 1 conteúdo para várias redes.
- sugerir_hashtags(tema, rede) — devolve hashtags relevantes.
- criar_calendario(semana, pilares[]) — plano editorial 7 dias.
- analisar_desempenho(metricas) — lê KPIs e propõe ajustes.
- aprovar_conteudo(payload) — envia para aprovação humana antes de publicar.

Fluxo padrão:
1. Clarifica o pedido em 1 pergunta se algo essencial faltar (tema, rede, CTA).
2. Gera a proposta.
3. Explica em 1-2 linhas a lógica (hook, formato, hashtags).
4. Pergunta se aprovas ou queres iterar.`,
  },
  {
    slug: "email-cold-outbound",
    name: "Email cold outbound",
    description: "Cold email personalizado, curto e direto.",
    category: "Conteúdo",
    content: `Cold email para {{persona}} na {{empresa_alvo}}.

Regras:
- Assunto: máximo 6 palavras, sem clickbait.
- Corpo: 60-90 palavras, 1 valor específico para {{empresa_alvo}}.
- Personalização real (menciona {{gatilho}}).
- CTA: 1 pergunta de baixo compromisso.

Devolve JSON: { assunto, corpo }`,
  },
  {
    slug: "resumo-reuniao",
    name: "Resumo de reunião",
    description: "Resume transcrição em decisões + ações.",
    category: "Conteúdo",
    content: `Transcrição:
"""
{{transcricao}}
"""

Devolve markdown:
## Decisões
- ...

## Ações
- [ ] {responsável} — {ação} — {prazo}

## Riscos / bloqueios
- ...`,
  },

  // ─── Extração / dados ────────────────────────────────
  {
    slug: "extrair-lead",
    name: "Extrair dados de lead",
    description: "Extrai nome, email, telefone e intenção de texto livre.",
    category: "Extração",
    content: `Do texto abaixo, extrai:
{ "nome", "email", "telefone", "empresa", "intencao" }

Se um campo não existir, devolve null. Não inventes.

Texto:
"""
{{texto}}
"""`,
  },
  {
    slug: "classificar-intent",
    name: "Classificar intenção",
    description: "Classifica intenção da mensagem numa taxonomia fixa.",
    category: "Extração",
    content: `Mensagem: "{{mensagem}}"

Escolhe UMA:
- comprar
- suporte
- reclamacao
- info_produto
- agendar
- outro

Devolve JSON: { "intent": "...", "confianca": 0.0-1.0 }`,
  },

  // ─── Interno / operacional ───────────────────────────
  {
    slug: "prompt-melhorador",
    name: "Melhorar prompt",
    description: "Recebe um prompt e devolve versão melhorada.",
    category: "Interno",
    content: `Prompt atual:
"""
{{prompt}}
"""

Melhora-o aplicando:
1. Objetivo claro na 1ª linha.
2. Regras explícitas em bullets.
3. Formato de output definido.
4. Exemplo few-shot se ajudar.

Devolve APENAS o prompt melhorado.`,
  },
  {
    slug: "resumo-conversa-whatsapp",
    name: "Resumo de conversa WhatsApp",
    description: "Resume conversa longa em 5-8 bullets acionáveis para o CRM.",
    category: "Interno",
    content: `Conversa:
"""
{{historico}}
"""

Devolve 5-8 bullets curtos com:
- Perfil do contacto
- Necessidade principal
- Objeções mencionadas
- Próximo passo combinado
- Sinais de compra

Sem preâmbulo.`,
  },
];
