# base. — Frontend Boilerplate

> Template de frontend moderno, pronto para produção, com autenticação completa, sistema de notificações, preferências de usuário e upload de avatar. Conectado a uma API REST real.

---

## O que é este projeto?

**base.** é um boilerplate de frontend construído para acelerar o desenvolvimento de novos produtos SaaS. Ele entrega, desde o primeiro `git clone`, uma aplicação visualmente polida e funcionalmente completa — sem precisar montar a estrutura do zero.

O frontend já vem integrado com um backend real (Node + Fastify), mas foi desenhado para que a camada de API seja facilmente substituível por qualquer outro servidor.

---

## Funcionalidades incluídas

### Autenticação completa
- Cadastro com validação de e-mail por **código OTP de 6 dígitos**
- Login com tokens JWT (access token + refresh token automático)
- Recuperação de senha com link por e-mail
- Regras de segurança: limite de tentativas, bloqueio de reuso das últimas 5 senhas, aviso ao usar senha antiga

### Perfil do usuário
- Edição de nome e bio
- Upload de avatar (armazenado no **Bunny.net Edge Storage**, com cache-busting automático)
- Seção de segurança e gerenciamento de conta

### Notificações
- Feed de notificações em tempo real (bem-vindo, e-mail confirmado, senha alterada, perfil atualizado, etc.)
- Marcar como lida individualmente ou todas de uma vez
- Badge numérico no header (1 a +99)

### Preferências
- Toggle de notificações por e-mail
- Toggle de novidades do produto
- Alternância entre **tema claro e escuro** (persistido no `localStorage`)

### Experiência de uso
- Guards de rota: áreas protegidas bloqueiam usuários não autenticados e não verificados
- Redirecionamento inteligente: usuários já logados são enviados ao dashboard ao acessar `/login` ou `/register`
- Skeletons e estados de carregamento em todas as listas
- Toasts de feedback (sucesso e erro) em todas as ações
- Atualizações otimistas na UI (sem esperar a resposta do servidor para atualizar a tela)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) v1 + React 19 |
| Roteamento | TanStack Router (file-based, SSR-ready) |
| Estilização | Tailwind CSS v4 (tokens customizados em `src/styles.css`) |
| Estado de servidor | TanStack Query v5 |
| Validação de formulários | Zod |
| Ícones | Lucide React |
| Gráficos | Recharts |
| UI | 100% construída do zero — sem bibliotecas de componentes |

---

## Estrutura de rotas

| Rota | Descrição | Status |
|------|-----------|--------|
| `/login` | Página de login | API real |
| `/register` | Cadastro de conta | API real |
| `/verificar-email` | Verificação por OTP | API real |
| `/forgot-password` | Solicitar redefinição de senha | API real |
| `/redefinir-senha` | Formulário de nova senha (via link) | API real |
| `/dashboard` | Painel principal com KPIs e gráfico | Mock (dados estáticos) |
| `/profile` | Perfil, avatar, segurança e preferências | API real |
| `/notifications` | Histórico de notificações da conta | API real |

---

## Estrutura de pastas relevante

```
src/
├── contexts/
│   ├── AuthContext.tsx        # Estado global de autenticação
│   └── ThemeContext.tsx       # Controle de tema claro/escuro
├── lib/
│   ├── api/
│   │   ├── client.ts          # apiFetch: cliente HTTP base com refresh automático
│   │   ├── auth.ts            # login, register, logout, verify-otp, reset-password...
│   │   ├── users.ts           # updateProfile, uploadAvatar, updatePreferences
│   │   └── notifications.ts   # listagem, marcar como lida
│   └── mock/
│       ├── kpis.ts            # KPIs do dashboard (mock)
│       ├── chart.ts           # Dados do gráfico (mock)
│       └── table.ts           # Tabela de faturas (mock)
├── routes/
│   ├── login.tsx
│   ├── register.tsx
│   ├── verificar-email.tsx
│   ├── forgot-password.tsx
│   ├── redefinir-senha.tsx
│   ├── _app.tsx               # Layout autenticado (guard de rota)
│   ├── _app.dashboard.tsx
│   ├── _app.profile.tsx
│   └── _app.notifications.tsx
└── components/
    └── layout/
        ├── Topbar.tsx         # Header com notificações e menu do usuário
        └── Sidebar.tsx        # Navegação lateral
```

---

## Como rodar

### Pré-requisitos

- Node.js 20+ ou Bun 1+
- Backend configurado e rodando (veja o repositório do backend)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/flaviolimadev/frontend-base.git
cd frontend-base

# Instale as dependências
npm install
# ou
bun install
```

### Configuração

Crie um arquivo `.env` na raiz:

```env
# URL base da API (o backend deve estar rodando)
VITE_API_URL=http://localhost:3001
```

### Executando em desenvolvimento

```bash
npm run dev
# ou
bun run dev
```

Acesse `http://localhost:3000`.

---

## Identidade visual

- **Acento principal:** verde-menta `#8FE3C0` → variável `--color-accent` em `src/styles.css`
- **Tipografia:** Instrument Serif (títulos) + Inter (corpo)
- **Tema:** claro e escuro, com alternância via `ThemeContext` e persistência em `localStorage`
- Para trocar a cor de acento, edite apenas `--color-accent` no bloco `@theme` de `src/styles.css` — todos os componentes herdam automaticamente

---

## Onde plugar outro backend

A integração com a API está isolada em `src/lib/api/`. O cliente base (`client.ts`) expõe a função `apiFetch`, que lida com:
- Injeção automática do token JWT no header `Authorization`
- Refresh automático do access token ao expirar (usando o refresh token no cookie)
- Tratamento padronizado de erros (classe `ApiError` com código de erro estruturado)

Para trocar o backend, basta atualizar os endpoints em `src/lib/api/auth.ts`, `users.ts` e `notifications.ts`. O restante da aplicação (telas, contextos, queries) não precisa mudar.

---

## Repositório do backend

O backend complementar (Node + Fastify + PostgreSQL + Prisma) está disponível em:
[github.com/flaviolimadev/backend-base](https://github.com/flaviolimadev/backend-base)

---

---

## Prompt para o Lovable

Use o bloco abaixo para criar qualquer novo sistema no [Lovable](https://lovable.dev) já partindo da base deste projeto. Cole-o no início da conversa, antes de descrever o que você quer construir, para que o Lovable entenda a stack, o design system e o que já existe — evitando retrabalho e mantendo consistência visual.

---

````
Estou construindo um novo sistema usando como base um boilerplate de frontend já existente. Preciso que você respeite rigorosamente a stack, o design system e as convenções abaixo ao gerar qualquer código novo.

---

## Stack

- **Framework:** TanStack Start v1 + React 19
- **Roteamento:** TanStack Router (file-based, SSR-ready). Rotas autenticadas ficam sob o layout `_app.tsx` (prefixo `_app.` no nome do arquivo).
- **Estilização:** Tailwind CSS v4. Não existe `tailwind.config.js`. Os tokens ficam em `src/styles.css` usando `@theme inline`.
- **Estado de servidor:** TanStack Query v5 (`useQuery`, `useMutation`, `invalidateQueries`)
- **Validação:** Zod
- **Ícones:** Lucide React (apenas outline)
- **Gráficos:** Recharts
- **Zero bibliotecas de componentes prontas** — toda a UI é construída do zero com os componentes em `src/components/ui/`

---

## Design System — Premium Minimalista

### Tokens de cor (usar sempre — nunca cores brutas como `#fff` ou `rgb(...)`)

| Token Tailwind | Uso |
|----------------|-----|
| `bg-bg` | Fundo da página |
| `bg-bg-elev` | Fundo elevado (sidebar, cards) |
| `bg-surface-1` / `bg-surface-2` / `bg-surface-3` | Superfícies, hover, seleção |
| `text-fg` | Texto principal |
| `text-fg-muted` | Texto secundário, labels |
| `border-line` / `border-line-strong` | Bordas padrão e foco |
| `text-accent` / `bg-accent` / `bg-accent-soft` | Cor primária / sucesso |
| `text-danger` / `bg-danger` | Erros e ações destrutivas |

**Tema escuro:** classe `.dark` no `<html>`. Tema claro é o padrão no `:root`. Alternância via `ThemeContext`.

### Tipografia

- Fonte corpo: **Inter Variable** (importada via `@fontsource-variable/inter`)
- Utilitários: `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-caption`, `font-display`, `tnum`

### Regras estéticas

- Sem gradientes roxos ou paletas "AI slop"
- Sem glassmorphism exagerado
- Sem sombras pesadas
- Sem emojis como elemento visual
- Animações apenas em `transform` e `opacity`
- Utilitários de animação disponíveis: `page-enter`, `stagger-children`, `shimmer`, `press`

### Densidade

Atributo `data-density` no `<html>` com valores `comfortable` (padrão) e `compact`. Afeta as variáveis `--row-h`, `--field-h`, `--card-pad`.

---

## O que já está implementado (não reimplementar)

### Autenticação completa
- Login com JWT (access token no `localStorage` como `bp.token`, refresh token em cookie httpOnly)
- Registro com verificação de e-mail por OTP de 6 dígitos
- Recuperação de senha por e-mail
- Regras de segurança: rate limit de 24h no reset, bloqueio de reuso das últimas 5 senhas

### Camada de API (`src/lib/api/`)
- `client.ts` — `apiFetch`: cliente HTTP base com refresh automático do token e classe `ApiError` com código estruturado
- `auth.ts` — login, register, logout, verify-otp, resend-otp, forgot-password, reset-password, /me
- `users.ts` — updateProfile, uploadAvatar, updatePreferences
- `notifications.ts` — listagem, marcar como lida (individual e todas)

### Contextos globais (`src/contexts/`)
- `AuthContext` — `useAuth()` → `{ user, status, login, register, logout, requestPasswordReset, resetPassword, updateProfile }`
- `ThemeContext` — `useTheme()` → `{ theme, setTheme, toggle }`
- `DensityContext` — `useDensity()` → `{ density, setDensity, toggle }`
- `ToastContext` — `useToast()` → `toast({ kind, title, description?, action?, duration? })`

### Páginas prontas
- `/login`, `/register`, `/verificar-email`, `/forgot-password`, `/redefinir-senha`
- `/dashboard` — KPIs, gráfico Recharts, tabela paginada com skeletons
- `/profile` — edição de dados pessoais, upload de avatar (Bunny.net), segurança, preferências
- `/notifications` — histórico de notificações com marcar como lida e badge numérico no header

### Guards de rota
- Áreas autenticadas: `beforeLoad` + verificação de `emailVerified` no `AppLayout`
- Usuários já logados redirecionados de `/login` e `/register` para `/dashboard`

---

## Convenções de código

- Componentes de página exportam uma `Route` com `createFileRoute` do TanStack Router
- Componentes UI ficam em `src/components/ui/` — composição via subcomponentes (`CardHeader`, `TabsList`, etc.)
- Layout de página usa `PageContainer` + `PageHeader` de `src/components/layout/PageContainer.tsx`
- Guards de rotas protegidas: `beforeLoad` síncrono checa `localStorage.getItem("bp.token")`
- Atualizações otimistas nas mutations do TanStack Query (`onMutate` → `onError` para reverter → `onSettled` para invalidar)
- Erros de formulário: `ApiError.code` específico → mensagem inline; erros genéricos → toast
- Notificações do sistema devem ser criadas no backend para cada ação relevante do usuário

---

## Deploy

- **Lovable.dev / Cloudflare Pages:** `npm run build` → usa `vite.config.ts` (Cloudflare Worker via Nitro)
- **EasyPanel / Docker (Node.js):** `npm run build:node` → usa `vite.config.node.ts` com Nitro `node-server`, inicia com `node .output/server/index.mjs`
- Deploy EasyPanel configurado via `nixpacks.toml` na raiz do projeto

---

## O que quero construir agora

[DESCREVA AQUI O QUE VOCÊ QUER ADICIONAR AO SISTEMA]
````

---

## Licença

MIT — use livremente em projetos pessoais e comerciais.
