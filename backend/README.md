# base. — Backend Boilerplate

> API REST pronta para produção, com autenticação JWT completa, verificação de e-mail por OTP, upload de arquivos, sistema de notificações e preferências de usuário. Construída para ser clonada e estendida em novos projetos SaaS.

---

## O que é este projeto?

**base. backend** é um servidor de API REST construído para ser a fundação de qualquer produto SaaS. Ele entrega, desde o primeiro clone, uma API segura, tipada e documentada — sem precisar montar a infraestrutura do zero a cada projeto novo.

A arquitetura é modular: cada domínio de negócio fica em sua própria pasta com schemas, service, controller e routes. Para adicionar um novo domínio, basta criar a pasta e registrar as rotas.

---

## Funcionalidades incluídas

### Autenticação completa
- Registro com verificação de e-mail por **código OTP de 6 dígitos** (TTL 15 min)
- Login com **JWT** (access token de ~15 min + refresh token de 7 dias em cookie httpOnly)
- Rotação de refresh token: cada token só pode ser usado **uma vez**
- Logout com invalidação de cookie e token no banco
- Recuperação de senha por e-mail com link tokenizado (TTL 1h)
- Regras de segurança: cooldown de 24h no forgot-password, bloqueio de reuso das últimas 5 senhas, sinalização de senha antiga no login

### Perfil do usuário
- Atualização de nome e bio
- Upload de avatar para **Bunny.net Edge Storage** com cache-busting automático por timestamp
- Atualização de preferências (notificações por e-mail, novidades do produto)

### Notificações
- Criação automática de notificação em cada ação relevante do usuário
- Endpoints para listar, marcar como lida (individual) e marcar todas como lidas
- Sistema extensível: novos tipos de notificação via enum no Prisma

### Infraestrutura
- Validação Zod em **toda** entrada (body, params, query) — o servidor não sobe com `.env` inválido
- Handler global de erros com shape padronizado (`code`, `message`, `details`)
- CORS configurável para múltiplas origens via variável de ambiente
- Seed de dados demo para desenvolvimento

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js |
| Framework | Fastify v5 |
| Linguagem | TypeScript strict (ESM) |
| Banco de dados | PostgreSQL via Prisma ORM |
| Autenticação | JWT (access + refresh) / argon2id |
| Validação | Zod |
| E-mail | Resend |
| Storage | Bunny.net Edge Storage |
| Módulo | ESM (`"type": "module"`) |

---

## Estrutura de pastas

```
backend/
├── docs/
│   └── api-contract.md         # Contrato completo de endpoints (fonte de verdade)
├── prisma/
│   ├── schema.prisma           # Modelos: User, RefreshToken, VerificationToken,
│   │                           #          PasswordHistory, Notification
│   └── seed.ts                 # Dados demo (demo@demo.com / demo1234)
├── scripts/
│   └── setup.mjs               # Bootstrap automático
├── src/
│   ├── config/
│   │   └── env.ts              # Validação Zod do .env — app não sobe com config inválida
│   ├── lib/
│   │   ├── prisma.ts           # Singleton PrismaClient
│   │   ├── jwt.ts              # signAccessToken, signRefreshToken, verify...
│   │   ├── hash.ts             # hashPassword, verifyPassword (argon2id)
│   │   ├── token.ts            # generateOtpCode (6 dígitos) + generateToken (link)
│   │   ├── storage.ts          # uploadFile, deleteFile (Bunny.net)
│   │   ├── notifications.ts    # createNotification — disparo fire-and-forget
│   │   └── email/
│   │       ├── client.ts       # Instância Resend
│   │       ├── send.ts         # sendEmail (best-effort — nunca derruba o fluxo)
│   │       └── templates.ts    # confirmCodeTemplate, resetPasswordTemplate
│   ├── modules/
│   │   ├── auth/               # register, login, refresh, logout, me,
│   │   │                       # confirm-email, resend-confirmation,
│   │   │                       # forgot-password, reset-password
│   │   ├── users/              # PATCH /me, POST /me/avatar, PATCH /me/preferences
│   │   └── notifications/      # GET, PATCH /read-all, PATCH /:id/read
│   ├── middlewares/
│   │   ├── authenticate.ts     # Guard Bearer → injeta req.user
│   │   └── error-handler.ts    # AppError + handler global
│   ├── plugins/
│   │   ├── cors.ts             # CORS_ORIGIN (suporta múltiplas origens)
│   │   └── cookie.ts           # COOKIE_SECRET
│   ├── app.ts                  # buildApp() — registra plugins e rotas
│   └── server.ts               # Entry point
└── .cursor/rules/              # Regras do Cursor AI
```

---

## Como rodar

### Pré-requisitos

- Node.js 20+
- PostgreSQL rodando (local ou via serviço)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e preencha todos os campos:

| Variável | O que é |
|----------|---------|
| `APP_NAME` | Nome do projeto (ex.: `"base."`) |
| `APP_URL` | URL do frontend (ex.: `http://localhost:3000`) |
| `DATABASE_URL` | URL do PostgreSQL |
| `JWT_ACCESS_SECRET` | String aleatória ≥ 32 chars |
| `JWT_REFRESH_SECRET` | Outra string aleatória ≥ 32 chars |
| `COOKIE_SECRET` | Mais uma string aleatória ≥ 32 chars |
| `CORS_ORIGIN` | URL(s) do frontend (vírgulas para múltiplas) |
| `RESEND_API_KEY` | Chave da API Resend para envio de e-mails |
| `EMAIL_FROM` | Remetente (ex.: `"base. <noreply@seudominio.com>"`) |
| `BUNNY_STORAGE_ACCESS_KEY` | Chave de acesso Bunny.net |
| `BUNNY_STORAGE_ZONE` | Nome do Storage Zone no Bunny.net |
| `BUNNY_CDN_URL` | URL pública do CDN (ex.: `https://seupullzone.b-cdn.net`) |

**Gerar segredos aleatórios:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Execute três vezes — uma para cada secret.

### 3. Aplicar migrations e gerar o Prisma Client

```bash
npm run setup
```

Este comando instala dependências, gera o Prisma Client e aplica as migrations no banco.

### 4. (Opcional) Popular com dados de desenvolvimento

```bash
npm run seed
```

Cria o usuário demo: `demo@demo.com` / `demo1234`.

### 5. Iniciar em desenvolvimento

```bash
npm run dev
```

O servidor sobe em `http://localhost:3001` (ou na `PORT` configurada no `.env`).

### 6. Verificar que está funcionando

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}
```

---

## Scripts disponíveis

| Script | Ação |
|--------|------|
| `npm run setup` | Bootstrap completo (install → generate → migrate) |
| `npm run dev` | Servidor em modo watch |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Sobe o build compilado |
| `npm run prisma:migrate` | Cria e aplica migration de desenvolvimento |
| `npm run prisma:generate` | Regenera o Prisma Client |
| `npm run seed` | Popula banco com dados demo |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Endpoints implementados

Ver [`docs/api-contract.md`](docs/api-contract.md) para a documentação completa.

### Resumo rápido

| Grupo | Rotas |
|-------|-------|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/logout`, `GET /api/auth/me` |
| Verificação | `POST /api/auth/confirm-email`, `/resend-confirmation` |
| Senha | `POST /api/auth/forgot-password`, `/reset-password` |
| Perfil | `PATCH /api/users/me`, `POST /api/users/me/avatar`, `PATCH /api/users/me/preferences` |
| Notificações | `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read` |
| Health | `GET /health` |

### Formato de erro padronizado

Toda resposta de erro segue este shape:

```json
{
  "error": {
    "code": "UPPERCASE_SNAKE",
    "message": "Mensagem legível ao humano.",
    "details": {}
  }
}
```

---

## Como adicionar um novo módulo

1. Criar `src/modules/<nome>/` com quatro arquivos:
   - `<nome>.schemas.ts` — schemas Zod e tipos inferidos
   - `<nome>.service.ts` — lógica de negócio (acessa Prisma e libs)
   - `<nome>.controller.ts` — lida com `req`/`reply`, chama o service
   - `<nome>.routes.ts` — registra as rotas no Fastify
2. Importar e registrar as rotas em `src/app.ts`
3. Atualizar `docs/api-contract.md` com os novos endpoints
4. Atualizar `.cursor/rules/030-api-contract.mdc` para refletir o mesmo contrato
5. Se a ação for relevante para o usuário, disparar `void createNotification(userId, type)` no service

---

## Repositório do frontend

O frontend complementar (TanStack Start + React 19 + Tailwind CSS v4) está disponível em:
[github.com/flaviolimadev/frontend-base](https://github.com/flaviolimadev/frontend-base)

---

## Licença

MIT — use livremente em projetos pessoais e comerciais.

---

## Prompt para o Cursor

Use o bloco abaixo no início de qualquer chat no Cursor para criar novas funcionalidades neste backend. O Cursor entenderá a stack, a arquitetura modular e as regras do projeto — evitando padrões errados e mantendo consistência.

---

````
Estou trabalhando no backend de um projeto SaaS. Preciso que você siga rigorosamente a stack, a arquitetura e as convenções abaixo ao gerar qualquer código novo.

---

## Stack

- **Runtime:** Node.js
- **Framework:** Fastify v5
- **Linguagem:** TypeScript strict, ESM (`"type": "module"`) — imports sempre com extensão `.js`
- **Banco:** PostgreSQL via **Prisma ORM**
- **Auth:** JWT (access ~15 min + refresh 7 dias em cookie httpOnly) / argon2id para senhas
- **Validação:** **Zod** em toda entrada (body, params, query) — obrigatório, sem exceções
- **E-mail:** Resend via `src/lib/email/send.ts` (best-effort, nunca derruba o fluxo)
- **Storage:** Bunny.net Edge Storage via `src/lib/storage.ts`

---

## Arquitetura de módulos

Cada domínio fica em `src/modules/<nome>/` com quatro arquivos:

```
<nome>.schemas.ts   → Zod schemas + tipos inferidos
<nome>.service.ts   → lógica de negócio (acessa Prisma, libs)
<nome>.controller.ts → req/reply, valida com .parse(), chama service
<nome>.routes.ts    → registra rotas no Fastify, importado em app.ts
```

Rotas sempre com prefixo `/api/`. Rotas protegidas usam `preHandler: [authenticate]`.

---

## Formato de erro padrão

```typescript
throw new AppError(STATUS_CODE, "UPPERCASE_CODE", "Mensagem legível.");
// Importar de: import { AppError } from "../../middlewares/error-handler.js"
```

Shape da resposta:
```json
{ "error": { "code": "UPPERCASE_SNAKE", "message": "...", "details": {} } }
```

Códigos em uso: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `PASSWORD_ALREADY_USED`, `INVALID_CODE`, `CODE_ALREADY_USED`, `CODE_EXPIRED`, `INVALID_TOKEN`, `TOKEN_ALREADY_USED`, `TOKEN_EXPIRED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `STORAGE_NOT_CONFIGURED`, `STORAGE_UPLOAD_FAILED`, `NOT_FOUND`, `INTERNAL_ERROR`.

---

## Regras inegociáveis

1. **Validação obrigatória:** nunca confiar em `req.body` sem `.parse()` com schema Zod antes.
2. **Imports com `.js`:** em ESM/NodeNext todos os imports locais precisam de extensão `.js`.
3. **`any` é proibido:** usar tipos explícitos ou `unknown`.
4. **Variáveis de ambiente:** sempre via `env.*` de `src/config/env.ts` — nunca `process.env.ALGO` direto.
5. **Senhas:** sempre hash com `hashPassword()` de `src/lib/hash.ts`; comparar com `verifyPassword()`.
6. **Tokens:** usar `generateOtpCode()` ou `generateToken()` de `src/lib/token.ts`; armazenar **apenas o hash SHA-256** no banco.
7. **Notificações:** toda ação relevante do usuário DEVE disparar `void createNotification(userId, type)` de `src/lib/notifications.ts` — fire-and-forget, nunca `await`.
8. **E-mail:** usar `sendEmail()` de `src/lib/email/send.ts` — erros são logados internamente, nunca propagados.
9. **`UserResponse`:** nunca incluir `passwordHash` na resposta. Usar a função `toUserResponse()` do service de users ou auth.

---

## UserResponse (shape padrão do usuário nas respostas)

```typescript
{
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  emailVerified: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
}
```

---

## O que já existe (não reimplementar)

### Módulo `auth` (`src/modules/auth/`)
- `POST /api/auth/register` → cria usuário, envia OTP, cria notificação `WELCOME`
- `POST /api/auth/login` → retorna `{ user, token }` + cookie `bp.refresh`
- `POST /api/auth/refresh` → rotaciona refresh token (uso único)
- `POST /api/auth/logout` → invalida cookie e token no banco
- `GET /api/auth/me` → retorna usuário autenticado
- `POST /api/auth/confirm-email` → valida OTP, marca `emailVerified`, notificação `EMAIL_VERIFIED`
- `POST /api/auth/resend-confirmation` → reenvio com cooldown de 1 min
- `POST /api/auth/forgot-password` → cooldown 24h, envia link, notificação `PASSWORD_RESET_REQUESTED`
- `POST /api/auth/reset-password` → valida token, bloqueia reuso das últimas 5 senhas, notificação `PASSWORD_CHANGED`

### Módulo `users` (`src/modules/users/`)
- `PATCH /api/users/me` → atualiza `name`/`bio`, notificação `PROFILE_UPDATED`
- `POST /api/users/me/avatar` → multipart, jpeg/png/webp, max 2 MB, upload Bunny.net, notificação `AVATAR_UPDATED`
- `PATCH /api/users/me/preferences` → atualiza `emailNotifications`/`productUpdates`

### Módulo `notifications` (`src/modules/notifications/`)
- `GET /api/notifications` → últimas 100, mais recentes primeiro
- `PATCH /api/notifications/read-all` → marca todas como lidas
- `PATCH /api/notifications/:id/read` → marca uma como lida

### Tipos de notificação disponíveis (`NotificationType`)
`WELCOME`, `EMAIL_VERIFIED`, `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED`, `PROFILE_UPDATED`, `AVATAR_UPDATED`

---

## Regra de documentação (obrigatória)

Ao adicionar ou modificar qualquer endpoint:
1. Atualizar `docs/api-contract.md` com o endpoint completo (método, auth, request, response, erros)
2. Atualizar `.cursor/rules/030-api-contract.mdc` com o resumo
3. Se adicionar novo `NotificationType`: atualizar enum no schema Prisma + `NOTIFICATION_CONTENT` em `src/lib/notifications.ts` + `.cursor/rules/060-notifications.mdc`

---

## O que quero construir agora

[DESCREVA AQUI O QUE VOCÊ QUER ADICIONAR AO BACKEND]
````
