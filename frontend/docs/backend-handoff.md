# Base UI Kit — Handoff Técnico para Backend

> Documento de transição do front-end mockado para a implementação real do backend.  
> **Data:** 2026-06-14 | **Stack:** TanStack Start v1 + React 19 + Tailwind CSS v4

---

## 1. Visão Geral do Produto

Boilerplate de SaaS com autenticação, dashboard com métricas e tabela de dados, perfil do usuário, tema light/dark, densidade ajustável e command palette. **Tudo ainda é mockado no front-end.** O objetivo deste documento é servir de guia para substituir os mocks por APIs reais.

### Páginas existentes
| Página | Rota | Estado |
|--------|------|--------|
| Login | `/login` | Mockado — credenciais fixas |
| Registro | `/register` | Mockado |
| Recuperar senha | `/forgot-password` | Mockado (sem e-mail real) |
| Nova senha | `/reset-password` | Mockado |
| Dashboard | `/dashboard` | Mockado — KPIs, gráfico, tabela |
| Perfil | `/profile` | Mockado — dados pessoais, senha, preferências |
| Home/Landing | `/` | Placeholder (index.tsx está vazio) |

### Escopo atual
- **Front-end only** — dados 100% mockados em `src/lib/mock/`
- **Componentes próprios** — zero shadcn/ui
- **Sem backend real** — todas as chamadas são `mockDelay()` + dados estáticos
- **Persistência local** — `localStorage` para sessão, tema e densidade

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | TanStack Start v1 | `^1.167.50` |
| Router | TanStack React Router | `^1.168.25` |
| React | React 19 | `^19.2.0` |
| Query | TanStack Query | `^5.83.0` |
| CSS | Tailwind CSS v4 | `^4.2.1` |
| Ícones | Lucide React | `^0.575.0` |
| Gráficos | Recharts | `^2.15.4` |
| Fonte | Inter Variable (Google Fonts) | `@fontsource-variable/inter` |
| Validação | Zod | `^3.24.2` |
| Build | Vite 7 | `^7.3.1` |
| Lint/Format | ESLint + Prettier | — |

### Notas importantes
- **Tailwind v4** usa CSS nativo (`@import "tailwindcss"`, `@theme inline`, `@utility`) — não existe `tailwind.config.js`.
- **TanStack Start** usa file-based routing em `src/routes/` — nunca criar `src/pages/`.
- **Server functions** (`createServerFn`) devem ficar em `src/lib/` ou próximo da rota, **nunca** em `src/server/` (bloqueado pelo import protection).
- SSR roda em ambiente Cloudflare Worker — evitar `child_process`, `fs.watch`, pacotes nativos.

---

## 3. Arquitetura de Rotas

File-based routing com layout pathless `_app` para área autenticada.

```
src/routes/
├── __root.tsx              # Layout raiz (Providers, <Outlet />)
├── index.tsx               # / (home — placeholder)
├── login.tsx               # /login
├── register.tsx            # /register
├── forgot-password.tsx     # /forgot-password
├── reset-password.tsx      # /reset-password
├── _app.tsx                # Layout autenticado (Sidebar + Topbar + Outlet)
├── _app.dashboard.tsx      # /dashboard
└── _app.profile.tsx        # /profile
```

### Guarda de autenticação (`_app.tsx`)
- Client-side only: checa `localStorage.getItem("bp.session")` no `beforeLoad`
- Redireciona para `/login?redirect=<url>` se não houver sessão
- **Quando substituir por backend:** usar `createServerFn` com middleware `requireSupabaseAuth` (ou similar) e mover a guarda para o loader da rota ou para um layout `_authenticated`.

### SEO / Meta
- Cada rota define `head()` com `title` e `meta`.
- Adicionar `og:title`, `og:description`, `og:image` em rotas leaf quando houver conteúdo relevante.

---

## 4. Componentes de UI Próprios

Todos em `src/components/ui/` — **zero shadcn/ui**.

| Componente | Props principais | Notas |
|------------|-----------------|-------|
| `Button` | `variant` (primary/secondary/ghost/danger), `size`, `loading`, `leftIcon` | `press` utility para feedback tátil (`scale-98`) |
| `Input` | `error?: string`, `type`, `autoComplete` | Label flutuante integrada; borda muda em erro |
| `Label` | `htmlFor`, `children` | — |
| `Textarea` | Mesma base de Input | — |
| `Card` | `CardHeader`, `CardBody`, `CardFooter` | Composição via subcomponentes |
| `Avatar` | `name`, `src?`, `size` | Gera iniciais se sem `src`; usa `src` direto |
| `Badge` | `tone` (accent/warn/danger/muted) | — |
| `Checkbox` | `checked`, `onChange`, `label`, `disabled` | Customizado, não nativo |
| `Tabs` | `TabsList`, `TabsTrigger`, `TabsContent` | Composição via context |
| `Dropdown` | `trigger` (ReactNode), children | Portalizado com `DropdownItem`, `DropdownSeparator` |
| `Skeleton` | `className` | Usa `shimmer` + `shimmer-anim` do CSS |
| `Spinner` | `size`, `className` | — |
| `PasswordStrength` | `value: string` | Barra de força visual (0–4) |
| `ThemeToggle` | — | Alterna light/dark |
| `DensityToggle` | — | Alterna comfortable/compact |
| `CommandPalette` | `open`, `onClose` | ⌘K global; busca fuzzy em páginas/ações; persiste recents em localStorage |

### Layout
| Componente | Função |
|-----------|--------|
| `AuthSplit` | Layout de autenticação: coluna de formulário + coluna de marca (só desktop) |
| `Sidebar` | Fixa no viewport, colapsável (64px / 232px); itens com `disabled` mostram cadeado |
| `Topbar` | Sticky, contém: busca ⌘K, toggle densidade, toggle tema, notificações, avatar com dropdown |
| `MobileDrawer` | Drawer de navegação em mobile (z-50, overlay escuro) |
| `PageContainer` | `max-w-6xl`, `px-4/8`, `pt-10 pb-16`, animação `page-enter` |
| `PageHeader` | `eyebrow` (label superior), `title` (display), `description` |

---

## 5. Contextos Globais (Providers)

Todos os providers estão em `src/contexts/` e são montados em `src/routes/__root.tsx`.

### 5.1 AuthContext (`AuthContext.tsx`)
```typescript
type AuthContextValue = {
  user: MockUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (patch: Partial<MockUser>) => void;
};
```
- **Persistência:** `localStorage` com chave `bp.session`
- **Mock:** credenciais fixas `demo@demo.com` / `demo1234` em `DEMO_CREDENTIALS`
- **Backend necessário:** endpoints de login, registro, forgot-password, reset-password, getMe, updateProfile

### 5.2 ThemeContext (`ThemeContext.tsx`)
- Chave LS: `bp.theme`
- Valores: `"light" | "dark"`
- Aplica classe `.dark` no `<html>` com transição suave (`theme-anim`)
- Tokens CSS reagem automaticamente via variáveis

### 5.3 DensityContext (`DensityContext.tsx`)
- Chave LS: `bp.density`
- Valores: `"comfortable" | "compact"`
- Aplica `data-density` no `<html>`; afeta `--row-h`, `--field-h`, `--card-pad`

### 5.4 ToastContext (`ToastContext.tsx`)
- API: `toast({ kind: "success" | "error" | "info", title, description?, action?, duration? })`
- Ação opcional com botão (ex: "Desfazer" no perfil)
- Posição: bottom-right, z-100
- **Backend:** não precisa — é puramente UI

---

## 6. Sistema de Design (Tokens)

### 6.1 Cores Semânticas
Todas as cores são CSS variables em `src/styles.css`, expostas via `@theme inline`.

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--bg` | `#fafaf9` | `#0a0a0b` | Fundo da página |
| `--bg-elev` | `#ffffff` | `#0e0e10` | Fundo elevado (sidebar, cards) |
| `--surface-1` | `#ffffff` | `#141416` | Superfície primária |
| `--surface-2` | `#f4f4f2` | `#1a1a1d` | Hover/seleção |
| `--surface-3` | `#e9e9e6` | `#232327` | Hover mais intenso |
| `--fg` | `#18181b` | `#ededed` | Texto principal |
| `--fg-muted` | `#6b6b70` | `#8a8a8f` | Texto secundário |
| `--line` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.06)` | Bordas |
| `--line-strong` | `rgba(0,0,0,0.14)` | `rgba(255,255,255,0.10)` | Bordas foco |
| `--accent` | `#2f8f6a` | `#8fe3c0` | Cor primária / sucesso |
| `--accent-soft` | `rgba(47,143,106,0.12)` | `rgba(143,227,192,0.12)` | Seleção / badges |
| `--accent-fg` | `#ffffff` | `#0a0a0b` | Texto sobre acento |
| `--danger` | `#c1272d` | `#e5484d` | Erros / ações destrutivas |
| `--popover` | `#ffffff` | `#1a1a1d` | Fundo de dropdowns/modais |
| `--shadow-pop` | sombra suave | sombra forte | Dropdowns, toasts |

### 6.2 Movimento
| Token | Valor | Uso |
|-------|-------|-----|
| `--dur-micro` | 120ms | Hover, press |
| `--dur-std` | 180ms | Transições de cor |
| `--dur-emph` | 240ms | Entrada de página |
| `--ease-in` | `cubic-bezier(0.2, 0, 0, 1)` | Entradas |
| `--ease-out` | `cubic-bezier(0.4, 0, 1, 1)` | Saídas |

### 6.3 Densidade
| Modo | `--row-h` | `--field-h` | `--card-pad` |
|------|-----------|-------------|--------------|
| comfortable | 3.25rem | 2.5rem | 1.25rem |
| compact | 2.5rem | 2.125rem | 0.875rem |

### 6.4 Tipografia
Fonte: **Inter Variable** (`@fontsource-variable/inter`)

| Utilitário | Tamanho | Uso |
|-----------|---------|-----|
| `text-display` | 3.05rem | Títulos de página |
| `text-h1` | 2.44rem | Seções |
| `text-h2` | 1.95rem | Subseções |
| `text-h3` | 1.56rem | Cards |
| `text-body` | 0.9375rem | Texto corrido |
| `text-caption` | 0.75rem | Labels, metadados |
| `font-display` | — | Títulos (weight 600, tracking -0.025em) |
| `tnum` | — | Números monoespaçados (preços, IDs) |

### 6.5 Animações
- `page-enter`: fade-in + translateY(6px) → 0
- `stagger-children`: cascata de até 8 filhos com delay de 30ms
- `shimmer-anim`: skeleton loading com gradiente
- `press`: `scale(0.98)` no `:active`
- `theme-anim`: transição suave de cores ao trocar tema
- `prefers-reduced-motion`: todas as animações são suprimidas

---

## 7. Dados Mockados

Todos os mocks estão em `src/lib/mock/`.

### 7.1 Usuário (`mock/users.ts`)
```typescript
type MockUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;  // ex: "Owner"
};
```
- Usuário demo: `demoUser` (id: `u_001`, name: `"Alex Moreira"`, email: `demo@demo.com`)
- Credenciais: `demo@demo.com` / `demo1234`

### 7.2 Autenticação (`mock/auth.ts`)
```typescript
mockLogin(email, password)         // delay 800ms, valida credenciais fixas
mockRegister({ name, email, password }) // delay 900ms, retorna usuário com id random
mockRequestPasswordReset(email)  // delay 700ms, valida @
mockResetPassword(token, newPassword) // delay 700ms, valida length >= 8
```

### 7.3 KPIs (`mock/kpis.ts`)
```typescript
type Kpi = {
  label: string;   // ex: "Receita recorrente"
  value: string;    // ex: "R$ 184,2k"
  delta: number;    // ex: 12.4 (%)
  hint: string;     // ex: "vs. mês anterior"
};
```
4 KPIs fixos. **Backend:** endpoint `/api/kpis` ou incluir no dashboard.

### 7.4 Gráfico (`mock/chart.ts`)
```typescript
type ChartPoint = { month: string; value: number };
```
12 meses de dados (Jan–Dez). **Backend:** endpoint `/api/charts/revenue`.

### 7.5 Tabela de Faturas (`mock/table.ts`)
```typescript
type Status = "ativo" | "pendente" | "cancelado" | "rascunho";
type Row = {
  id: string;       // ex: "INV-1000"
  client: string;
  email: string;
  status: Status;
  amount: number;   // em centavos/reais
  date: string;     // ISO 8601
};
```
25 registros gerados a partir de array de nomes.  
**Backend:** endpoint paginado e ordenável `/api/invoices`.

### 7.6 Notificações (`mock/notifications.ts`)
```typescript
type Notification = {
  id: string;
  title: string;
  body: string;
  unread: boolean;
  time: string;  // texto relativo ("há 8 min")
};
```
3 notificações fixas. **Backend:** endpoint `/api/notifications` com marcação de lida.

---

## 8. Funcionalidades por Página

### 8.1 Login (`/login`)
- Validação de e-mail (regex) e senha (mín 4 chars)
- Mock: credenciais fixas
- "Lembrar de mim" — checkbox (não implementa nada além de estado)
- Link para `/forgot-password`
- Demo credentials box no final do formulário

**APIs necessárias:**
```
POST /api/auth/login      → { email, password } → { user, token }
GET  /api/auth/me         → retorna usuário atual (via token/JWT)
```

### 8.2 Registro (`/register`)
- Validação: nome (>= 2), e-mail, senha (>= 8), confirmação, termos
- PasswordStrength component (barra visual 0–4)
- Mock: cria usuário com id random

**APIs necessárias:**
```
POST /api/auth/register   → { name, email, password } → { user, token }
```

### 8.3 Recuperar senha (`/forgot-password`)
- Envia e-mail com link/token
- Estados: formulário → sucesso (confira seu e-mail)
- Mock: apenas delay + validação de @

**APIs necessárias:**
```
POST /api/auth/forgot-password → { email } → 204
```

### 8.4 Nova senha (`/reset-password`)
- Aceita token (da URL) e nova senha
- Validação: mín 8 chars
- Mock: apenas delay

**APIs necessárias:**
```
POST /api/auth/reset-password  → { token, newPassword } → 204
```

### 8.5 Dashboard (`/dashboard`)
- **KPIs:** 4 cards com valor, delta percentual e hint
- **Gráfico:** LineChart (Recharts) com 12 meses, tooltip customizado, cores adaptativas ao tema via `useThemeColors`
- **Tabela:** 25 faturas com:
  - Ordenação por coluna (cliente, status, valor, data)
  - Paginação client-side (8 por página)
  - Badges de status com cores semânticas
  - Dropdown por linha (Ver detalhes, Duplicar, Excluir)
  - Skeleton loading inicial (550ms)
  - Estado vazio com ícone Inbox
  - Exportar (botão placeholder)

**APIs necessárias:**
```
GET  /api/dashboard          → { kpis, chart, recentInvoices }
GET  /api/invoices           → paginado, sortable, filterable
POST /api/invoices/:id/duplicate
DELETE /api/invoices/:id
GET  /api/invoices/export    → CSV/Excel
```

### 8.6 Perfil (`/profile`)
- **Tabs:** Dados pessoais | Segurança | Preferências
- **Dados pessoais:**
  - Avatar (upload mockado com `URL.createObjectURL`)
  - Nome, e-mail, bio
  - **Optimistic UI:** salva localmente imediatamente, toast com "Desfazer"
- **Segurança:** senha atual, nova senha, confirmação (validação local)
- **Preferências:** checkboxes de notificações (estado local)

**APIs necessárias:**
```
PATCH /api/users/me          → atualiza { name, email, bio, avatarUrl }
POST  /api/users/me/avatar   → multipart/form-data
POST  /api/auth/change-password → { currentPassword, newPassword }
GET   /api/users/me/preferences → { emailNotif, productUpdates, ... }
PATCH /api/users/me/preferences → atualiza preferências
```

---

## 9. Command Palette (`src/components/ui/CommandPalette.tsx`)

- Gatilho: `⌘/Ctrl + K` (global, listener em `document`)
- Busca fuzzy em páginas e ações
- Agrupamento: "Páginas" e "Ações"
- Persiste 5 itens recentes em `localStorage` (`bp.cmd.recent`)
- Navegação por teclado (↑↓ Enter Escape)
- **Backend:** não precisa — é puramente client-side e navegação interna

---

## 10. O que precisa ser implementado no Backend

### 10.1 Autenticação (prioridade máxima)
- [ ] Login com JWT (access + refresh tokens)
- [ ] Registro com validação de e-mail único
- [ ] Forgot password (envio real de e-mail com token/link)
- [ ] Reset password (validação de token)
- [ ] Change password (autenticado)
- [ ] Get current user (`/api/auth/me`)
- [ ] Logout (invalidar token/refresh)
- [ ] Middleware de autenticação para rotas protegidas

### 10.2 Usuário / Perfil
- [ ] CRUD de perfil (name, email, bio)
- [ ] Upload de avatar (storage S3/Blob/etc)
- [ ] Preferências do usuário (notificações, tema, densidade — opcional migrar do localStorage)

### 10.3 Dashboard
- [ ] Endpoint de KPIs (calcular delta vs período anterior)
- [ ] Endpoint de dados do gráfico (receita mensal)
- [ ] Endpoint de faturas (paginação, ordenação, filtros)
- [ ] Ações em faturas: duplicar, excluir
- [ ] Exportação CSV/Excel

### 10.4 Notificações
- [ ] Endpoint de notificações do usuário
- [ ] Marcar como lida
- [ ] Badge de unread count (SSE ou polling)

### 10.5 Segurança & Infra
- [ ] CORS configurado
- [ ] Rate limiting em auth
- [ ] Validação de input (Zod no server functions ou no backend)
- [ ] Hash de senha (bcrypt/argon2)
- [ ] RLS (Row Level Security) se usar PostgreSQL/Supabase

---

## 11. Convenções & Padrões do Projeto

### 11.1 Importações
- `@tanstack/react-router` — router e navegação (nunca `react-router-dom`)
- `@tanstack/react-start` — `createServerFn` (nunca `@tanstack/start`)
- `lucide-react` — todos os ícones
- `clsx` + `tailwind-merge` → `cn()` em `src/lib/cn.ts`

### 11.2 Estilo de código
- **Sem `any`:** TypeScript strict habilitado
- **Hooks:** prefixo `use` (ex: `useAuth`, `useToast`, `useTheme`)
- **Componentes:** PascalCase, exports nomeados
- **Mocks:** sempre com `mockDelay()` para simular latência de rede
- **Loading states:** Skeleton para conteúdo, spinner para ações
- **Formulários:** validação no submit, não no change; erros por campo
- **Acessibilidade:** `aria-label`, `focus-visible`, `role="status"`, teclado

### 11.3 CSS / Tailwind v4
- Tokens sempre via CSS variables (nunca cores hardcoded em componentes)
- Utilitários customizados em `@utility` no `styles.css`
- Dark mode via classe `.dark` no `<html>`
- Densidade via `data-density` no `<html>`

### 11.4 State Management
- **Local:** `useState` para formulários e UI efêmera
- **Global:** Contexts para auth, theme, density, toast
- **Server state:** TanStack Query (ainda não usado — usar quando migrar para APIs reais)
- **Persistência:** `localStorage` para sessão, tema, densidade, recents do command palette

---

## 12. Checklist de Migração (Frontend → Backend)

### Fase 1: Auth
1. Substituir `mockLogin` → `createServerFn` ou fetch real
2. Substituir `mockRegister` → API real
3. Substituir guarda de rota (`localStorage` check) → middleware de auth no server
4. Mover sessão de `localStorage` para cookie httpOnly / JWT
5. Implementar logout real (invalidar token)

### Fase 2: Dashboard
1. Substituir `kpis` mock → endpoint real
2. Substituir `chartData` mock → endpoint real
3. Substituir `tableRows` mock → endpoint paginado
4. Implementar ordenação e paginação no backend

### Fase 3: Perfil
1. Substituir `updateProfile` mock → PATCH real
2. Implementar upload de avatar (storage)
3. Mover preferências para backend (opcional)

### Fase 4: Notificações
1. Substituir `notifications` mock → endpoint real
2. Implementar marcação de lida

### Fase 5: Polimento
1. Remover pasta `src/lib/mock/` (ou manter para dev/storybook)
2. Adicionar loading states reais (TanStack Query `isPending`)
3. Adicionar tratamento de erro de rede
4. Implementar retry de requisições

---

## 13. Estrutura de Pastas

```
src/
├── components/
│   ├── layout/          # Sidebar, Topbar, AuthSplit, MobileDrawer, PageContainer
│   └── ui/              # Componentes reutilizáveis (Button, Input, Card, etc.)
├── contexts/            # Providers globais (Auth, Theme, Density, Toast)
├── hooks/               # (vazio — adicionar hooks customizados aqui)
├── lib/
│   ├── api/             # (vazio — para clientes de API reais)
│   ├── mock/            # Todos os mocks (remover após backend)
│   ├── cn.ts            # clsx + tailwind-merge
│   ├── useThemeColors.ts # Hook para cores adaptativas do Recharts
│   └── utils.ts         # Funções utilitárias
├── routes/              # Rotas do TanStack Router
│   ├── __root.tsx       # Root layout + Providers
│   ├── _app.tsx         # Layout autenticado
│   ├── _app.dashboard.tsx
│   ├── _app.profile.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   └── index.tsx        # Home (placeholder)
├── router.tsx           # Configuração do router
├── start.ts             # Configuração do TanStack Start
├── server.ts            # Configuração do servidor (Nitro)
└── styles.css           # Tokens, tema, animações, utilitários Tailwind
```

---

## 14. Notas para o Cursor / AI

> Cole este documento em `.cursor/rules.md` ou `.cursor/project-spec.md` para que o AI assistente saiba o contexto completo do projeto.

**Regras importantes para continuar o desenvolvimento:**
1. Nunca usar `src/pages/` — TanStack Start usa `src/routes/`
2. Nunca importar de `@tanstack/start` ou `react-router-dom`
3. Nunca colocar `createServerFn` em `src/server/` (import protection)
4. Sempre usar `createServerFn` de `@tanstack/react-start`
5. Sempre validar com Zod em server functions
6. Manter tokens CSS em `styles.css` — nunca hardcode cores em componentes
7. Preferir `useServerFn` + `useQuery` a `useEffect` + `fetch`
8. Todos os componentes são próprios — nunca instalar shadcn/ui
9. Manter suporte a `prefers-reduced-motion`
10. Sempre usar semantic HTML e `aria-*` para acessibilidade
