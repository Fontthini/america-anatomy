# Cursor Project Rules — lumina-ui

Regras modulares para o assistente AI. Formato: `.mdc` com frontmatter YAML.

| Arquivo | Escopo | Quando aplica |
|---------|--------|---------------|
| `000-project-overview.mdc` | Produto, stack, rotas, mapa de pastas | Sempre (`alwaysApply: true`) |
| `010-conventions.mdc` | Imports, nomenclatura, roteamento, proibições | Sempre |
| `020-design-system.mdc` | Tokens, tipografia, motion, estética | Ao editar `src/components/**`, `src/styles/**`, `**/*.css` |
| `030-state-and-contexts.mdc` | Auth, Theme, Density, Toast | Ao editar `src/contexts/**`, `src/hooks/**` |
| `040-mocks-and-backend-integration.mdc` | Tipos mock, contrato API, pontos de troca, checklist | Sempre |

**Fonte canônica:** [`docs/backend-handoff.md`](../docs/backend-handoff.md) — documentação técnica completa do front-end.

Para integração backend, priorize `000`, `010` e `040`.
