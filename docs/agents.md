# Runbook — Agentic AI

## Fluxo obrigatório para nova versão de prompt

1. **Criar rascunho:** `/admin/agentic-ai/:id/versoes` → "Nova versão".
2. **Editar** o system prompt e ajustar modelo/temperatura se necessário. Guardar.
3. **Submeter para revisão** (estado: `pending_review`).
4. **Correr suite de testes:** `npm run test -- tests/agents/<agente>.test.ts`.
5. **Aprovar** (só admin). A versão aprovada anterior é arquivada automaticamente.
6. **Ativar em produção** — o campo `active_version_id` do agente passa a apontar para esta versão. É esta versão que o wrapper `recordRun` deve usar.
7. **Monitorizar** em `/admin/agentic-ai/monitoring` durante 24h — se a taxa de erro subir >5% ou latência p95 duplicar, reverter para a versão anterior.

## Reversão de emergência

Voltar à versão anterior:
1. `/admin/agentic-ai/:id/versoes` → selecionar a versão aprovada anterior.
2. Clicar "Ativar em produção".

## Testes

- **Contrato de saída:** cada agente valida contra schema Zod em `src/lib/agenticSchemas.ts`.
- **Regras de negócio:** validadas em código após parse (score 0-100, tags obrigatórias, CTA final, comprimentos SEO).
- **Guard-rails:** injection, PT-PT, handoff correto.
- Correr todos: `npx vitest run tests/agents`.

## Monitorização

- Tabela `agentic_run_logs`: uma linha por execução (agente, versão, latência, tokens, custo, erro).
- Cada execução em produção deve passar por `recordRun()` de `src/lib/agenticRun.ts`.
- Painel: `/admin/agentic-ai/monitoring` — filtro por agente, janela 24h/7d/30d.
- Cruzar com AI Gateway logs quando precisares do payload completo.
