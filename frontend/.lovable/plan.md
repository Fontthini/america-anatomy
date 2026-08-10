## Visão geral

Boilerplate **somente front-end** com TanStack Start (mantendo a stack atual do projeto, que cumpre o papel do React Router), Tailwind v4 e componentes 100% construídos do zero. Tudo mockado: auth, dados do dashboard, perfil. Estética "Premium Minimalista Dark" — preto profundo, acento verde-menta `#8FE3C0`, Instrument Serif (títulos) + Inter (corpo).

Sem backend, sem Supabase, sem variáveis de ambiente. A camada `useAuth` e os mocks ficam isolados para troca futura por API real.

---

## 1. Limpeza da base

- Apagar todo `src/components/ui/*` (shadcn) — proibido por regra.
- Remover dependências shadcn/Radix do `package.json` (radix-*, cmdk, vaul, sonner, react-day-picker, embla, input-otp, react-resizable-panels, recharts permanece, lucide-react permanece).
- Resetar `src/styles.css` removendo tokens shadcn; manter apenas `@import "tailwindcss"` + tokens próprios.
- Substituir o placeholder de `src/routes/index.tsx`.

## 2. Design tokens (`src/styles.css`)

CSS variables sob `@theme` para que virem utilitários Tailwind (`bg-surface-1`, `text-fg`, `border-line`, `text-accent` etc.):

```text
--color-bg          #0A0A0B   (fundo base)
--color-bg-elev     #0E0E10
--color-surface-1   #141416
--color-surface-2   #1A1A1D
--color-surface-3   #232327
--color-fg          #EDEDED
--color-fg-muted    #8A8A8F
--color-line        rgba(255,255,255,.06)
--color-line-strong rgba(255,255,255,.10)
--color-accent      #8FE3C0
--color-accent-fg   #0A0A0B
--color-danger      #E5484D
--font-sans   "Inter", system-ui, sans-serif
--font-serif  "Instrument Serif", Georgia, serif
--radius      0.5rem   (rounded-lg padrão; máximo rounded-xl)
```

Fontes carregadas via `<link>` no `head` do `__root.tsx` (preconnect + Google Fonts para Inter 400/500/600 e Instrument Serif 400). Dark por padrão no `<html class="dark">`; estrutura pronta para futuro light mode.

## 3. Estrutura de pastas

```text
src/
  routes/
    __root.tsx            (shell + fontes + meta)
    index.tsx             (redireciona p/ /login ou /dashboard)
    login.tsx
    register.tsx
    forgot-password.tsx
    reset-password.tsx
    _app.tsx              (layout autenticado: sidebar+topbar+<Outlet/>)
    _app.dashboard.tsx
    _app.profile.tsx
  components/
    ui/                   (design system próprio, zero deps)
      Button.tsx Input.tsx Label.tsx Card.tsx Badge.tsx
      Avatar.tsx Dropdown.tsx Modal.tsx Tabs.tsx Table.tsx
      Toast.tsx (+ ToastProvider) Skeleton.tsx Spinner.tsx
      Checkbox.tsx PasswordStrength.tsx
    layout/
      Sidebar.tsx Topbar.tsx MobileDrawer.tsx ProtectedRoute.tsx
      AuthSplit.tsx        (layout split usado nas telas de auth)
  contexts/
    AuthContext.tsx
    ToastContext.tsx
  hooks/
    useAuth.ts  useToast.ts  useMediaQuery.ts
  lib/
    cn.ts                  (clsx + tailwind-merge)
    mock/
      users.ts             (usuário fake + credenciais demo)
      auth.ts              (login/register/reset com setTimeout)
      kpis.ts              (4 KPIs)
      chart.ts             (série mensal p/ Recharts)
      table.ts             (~25 linhas para paginar)
      notifications.ts
```

Observação: mantemos `src/routes/api/example.ts`, `src/lib/api/example.functions.ts`, `src/lib/config.server.ts`, `src/start.ts` e `src/server.ts` intocados — fazem parte do bootstrap do TanStack Start. Nada de backend novo será criado.

## 4. Camada de auth mockada

`AuthContext` expõe:

```text
user: MockUser | null
status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
login(email, password): Promise<void>
register(payload): Promise<void>
logout(): void
requestPasswordReset(email): Promise<void>
resetPassword(token, newPassword): Promise<void>
```

- Todas as funções usam `await new Promise(r => setTimeout(r, 600~1000))` para simular latência e podem rejeitar com erros descritivos (ex.: credenciais inválidas se email ≠ `demo@demo.com` / senha ≠ `demo1234`).
- Sessão persistida em `localStorage` (`bp.session`), reidratada no mount.
- `<ProtectedRoute>` envolve o layout `_app.tsx`: se não autenticado, redireciona para `/login` com `redirect` search param.
- Comentários `// TODO: replace with real API call` em cada função, para o ponto de plug futuro ficar óbvio.

## 5. Design system (resumo de variantes)

- **Button**: `variant` = primary (bg accent, texto preto), secondary (surface-2 + borda), ghost (transparente, hover surface-1), danger (borda + texto danger). `size` = sm/md/lg. Estado `loading` com Spinner inline. Foco: `ring-1 ring-accent/60 ring-offset-2 ring-offset-bg`.
- **Input/Label**: borda 1px `border-line`, foco com borda `accent/60`, mensagem de erro discreta abaixo.
- **Card**: `bg-surface-1` + `border border-line` + `rounded-lg`. Sem sombras grandes.
- **Tabs**: underline fino com transição da cor de acento (sem pílulas coloridas).
- **Table**: linhas com `border-b border-line`, hover `bg-surface-1/60`, paginação minimalista (← Página X de Y →), estado vazio com ícone Lucide outline + texto cinza.
- **Dropdown/Modal/Toast**: implementados com `useEffect` + portal simples + foco controlado por teclado (Esc fecha, Tab cycla). Sem Radix.
- **Skeleton**: blocos `bg-surface-2` com animação `animate-pulse` curta.

Transições globais: 150ms ease. Hover muda borda para `line-strong`, nunca cor saturada.

## 6. Telas

**/login** — Split 2 colunas em desktop, coluna única no mobile.
- Esquerda: formulário (email, senha, lembrar de mim, links "Esqueci a senha" e "Criar conta"). Validação inline (email válido, senha ≥ 8). Botão `Entrar` (primary). Submit chama `login()` mock → toast de erro ou redireciona para `/dashboard`. Dica visual de credenciais demo no rodapé.
- Direita: painel `bg-bg-elev` com marca pequena no topo, frase grande serifada (ex.: "Build with restraint."), pequena linha-assinatura no rodapé. Sem ilustrações.

**/register** — Mesmo split. Campos: nome, email, senha, confirmar senha, checkbox de termos. `PasswordStrength` (4 barras finas, sem cores berrantes — cinza → accent conforme força). Submit mockado → autentica e vai ao dashboard.

**/forgot-password** — Etapa 1: input de email → estado "Enviamos um link para X" com ícone outline e botão de voltar.
**/reset-password** — Etapa 2: nova senha + confirmação → estado de sucesso → CTA "Ir para login".

**/dashboard** — Dentro de `_app` (sidebar fixa recolhível com toggle, perfil no rodapé da sidebar; topbar com campo de busca + hint ⌘K, sino com badge de contagem, avatar com dropdown — Perfil / Preferências / Sair).
- Header da página: título serifado grande + subtítulo cinza.
- 4 cards de KPI: número grande em Instrument Serif, label em Inter `text-fg-muted`, delta % com seta (verde-menta para positivo, fg-muted para neutro — sem vermelho neon).
- Gráfico Recharts: `LineChart` com linha 1.5px na cor accent, sem grid pesado (apenas linha horizontal sutil), tooltip dark customizado, eixos cinza.
- Tabela: 8 linhas por página, colunas (Cliente, Status badge, Valor, Data, Ações dropdown). Estado vazio desenhado. Skeletons enquanto `await mockDelay()`.

**/profile** — Tabs internas (Dados pessoais / Segurança / Preferências).
- Dados: avatar com botão "Trocar" (fake `URL.createObjectURL` preview), nome, email, bio (textarea).
- Segurança: senha atual + nova + confirmar, submit mockado com toast de sucesso.
- Preferências: switches custom (idioma, notificações por email, tema — desabilitado com label "Em breve").

## 7. Responsividade & acessibilidade

- Breakpoint `md`: split de auth vira coluna única (painel da marca some ou vira faixa superior compacta).
- Sidebar: em `<md` vira drawer acionado por botão hambúrguer na topbar, com overlay e trap de foco.
- Todos os inputs com `<Label htmlFor>`, botões com `aria-label` quando icon-only, foco visível em tudo, navegação por teclado nos Dropdown/Modal/Tabs, contraste AA verificado contra `#0A0A0B`.

## 8. README

Curto, em português:
- "Boilerplate 100% front-end, dados mockados."
- Credenciais demo (`demo@demo.com` / `demo1234`).
- Onde plugar API real: `src/contexts/AuthContext.tsx` e arquivos em `src/lib/mock/*`.
- Como trocar a cor de acento (alterar `--color-accent` em `styles.css`).
- Aviso: ignorar prompts de habilitar Supabase/backend.

---

## Detalhes técnicos (para revisão)

- **Roteamento**: TanStack Router file-based em vez de React Router DOM. `<Link to="/dashboard">` substitui `<Link to=…>` do RRD com tipagem. `_app.tsx` é layout pathless protegido — guarda via `beforeLoad` lendo a sessão do `localStorage` e fazendo `throw redirect({ to: '/login', search: { redirect: location.href } })` quando ausente.
- **Não usar `createServerFn` nem rotas em `src/routes/api/`** para auth — tudo client-side. O arquivo `api/example.ts` existente permanece como referência inerte.
- **Fontes**: carregadas via `<link>` no `head` do root (regra do Tailwind v4 — proibido `@import` de URL em `styles.css`).
- **`cn` util**: instalar `clsx` + `tailwind-merge` (já podem estar presentes — verificar antes).
- **Remoção shadcn**: `bun remove` das libs Radix/cmdk/vaul/sonner/etc. em um único passo; manter `lucide-react`, `recharts`, `react-hook-form` (opcional — posso usar estado nativo para manter zero-deps de form), `zod` (útil pra validação).
- **Validação de formulários**: estado controlado simples + funções `validate()` por campo. Sem react-hook-form para reduzir superfície, exceto se você preferir mantê-lo.
- **Persistência da sessão**: `localStorage` com chave `bp.session` (JSON com user). Hidratação síncrona no `AuthProvider` antes do primeiro render para evitar flash.
- **Mock delay helper**: `mockDelay(ms = 700)` reutilizado em todos os mocks.
