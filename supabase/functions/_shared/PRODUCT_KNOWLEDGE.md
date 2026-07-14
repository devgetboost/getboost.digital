# product-knowledge — allowlist e normalização de `product_slug`

Este módulo (`product-knowledge.ts`) injeta contexto de produto no `system_prompt`
dos assistentes (chat + WhatsApp). Para evitar prompt-injection e envenenamento
do prompt base, o `product_slug` é sempre normalizado e validado antes de tocar
na BD.

## Regra de validação

```ts
const SLUG_RE = /^[a-z0-9-]{1,40}$/;
```

Um slug só é aceite se, após `trim().toLowerCase()`:

1. Não for vazio.
2. Bater com `SLUG_RE` — apenas `a–z`, `0–9` e `-`, entre 1 e 40 caracteres.
3. Estiver na **allowlist** abaixo.

Slugs fora da allowlist (ou `"geral"`) **não injetam** conhecimento — o
`buildProductKnowledgeSection` devolve `""` e o `system_prompt` base fica
intacto. O wrapper `buildProductKnowledgeSectionOrFallback` devolve nesse caso
uma secção neutra (`NEUTRAL_PRODUCT_FALLBACK_SECTION`) que instrui o modelo a
manter-se genérico.

## Allowlist

| Slug         | Injeta pack? |
| ------------ | ------------ |
| `qook`       | ✅            |
| `motivae`    | ✅            |
| `hostify`    | ✅            |
| `pikto`      | ✅            |
| `trackfy`    | ✅            |
| `prosafe360` | ✅            |
| `geral`      | ❌ (fallback) |

Para adicionar um produto novo: atualizar `ALLOWED_SLUGS` em
`product-knowledge.ts`, o array `candidates` em `deriveProductSlugFromLead`,
e criar a linha correspondente em `product_knowledge`.

## Exemplos

### Aceites (após normalização)

| Input                | Resultado    |
| -------------------- | ------------ |
| `"qook"`             | `"qook"`     |
| `"QOOK"`             | `"qook"`     |
| `"  motivae  "`      | `"motivae"`  |
| `"Hostify"`          | `"hostify"`  |
| `"prosafe360"`       | `"prosafe360"` |

### Rejeitados (→ `null` → fallback)

| Input               | Motivo                              |
| ------------------- | ----------------------------------- |
| `null` / `undefined`| ausente                             |
| `""` / `"   "`      | vazio                               |
| `"qook demo"`       | contém espaço                       |
| `"qook!"`           | símbolo fora de `[a-z0-9-]`         |
| `"qook_v2"`         | `_` não é permitido                 |
| `"a".repeat(41)`    | excede 40 caracteres                |
| `"outro-produto"`   | passa a regex mas não está na allowlist |
| `"qook2"`           | não está na allowlist               |
| `"geral"`           | válido mas tratado como fallback    |

## Derivação a partir do lead

`deriveProductSlugFromLead(lead)` tenta, por ordem:

1. `lead.resource_id` → `normalizeProductSlug` (ignora `"geral"`).
2. `lead.source` começa por `"demo:<slug>"` → normaliza o que vem depois.
3. `lead.source` contém o nome de um produto da allowlist (match por substring).
4. Nenhum → `{ slug: null, derivedFrom: "none" }` → fallback neutro.

## Testes

Cobertura em `product-knowledge.test.ts` (Deno):

```bash
deno test --allow-net --allow-env supabase/functions/_shared/product-knowledge.test.ts
```
