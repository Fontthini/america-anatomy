# API Contract

> **Fonte de verdade** dos endpoints desta API.  
> Manter este arquivo sincronizado com o código a cada mudança de endpoint.  
> Refletido também em `.cursor/rules/030-api-contract.mdc`.

---

## Convenções gerais

- **Base URL:** `http://localhost:<PORT>` (dev) / `https://api.seu-dominio.com` (prod)
- **Prefixo:** todas as rotas de negócio iniciam com `/api/`
- **Content-Type:** `application/json` em requisições e respostas
- **Autenticação:** `Authorization: Bearer <access_token>` nas rotas protegidas
- **Cookies:** `credentials: "include"` obrigatório no fetch do front-end

---

## Tipo base: `UserResponse`

Shape retornado em toda resposta que contém um usuário. Campos `null` são **omitidos**.

```typescript
{
  id: string;                   // cuid
  name: string;
  email: string;
  avatarUrl?: string;           // omitido se não definido
  bio?: string;                 // omitido se não definido
  role: string;                 // padrão "Owner"
  emailVerified: boolean;       // false até confirmar e-mail
  emailNotifications: boolean;  // preferência de notificação por e-mail (padrão true)
  productUpdates: boolean;      // preferência de novidades do produto (padrão false)
}
```

`passwordHash` **nunca** aparece em resposta alguma.

---

## Formato de erro

Todos os erros seguem este shape:

```json
{
  "error": {
    "code": "UPPERCASE_SNAKE",
    "message": "Mensagem legível ao humano.",
    "details": {}
  }
}
```

### Códigos de erro em uso

| Código | Status HTTP | Quando |
|--------|-------------|--------|
| `VALIDATION_ERROR` | 400 | Input inválido (Zod) |
| `BAD_REQUEST` | 400 | Corpo malformado |
| `INVALID_TOKEN` | 400 | Token de link inválido (reset de senha) |
| `TOKEN_ALREADY_USED` | 400 | Token de link de reset já utilizado |
| `TOKEN_EXPIRED` | 400/401 | 400 = link de reset expirado (1h); 401 = access/refresh JWT expirado |
| `INVALID_CODE` | 400 | Código OTP inválido (verificação de e-mail) |
| `CODE_ALREADY_USED` | 400 | Código OTP já utilizado |
| `CODE_EXPIRED` | 400 | Código OTP expirado (15 min) |
| `PASSWORD_ALREADY_USED` | 400 | Nova senha igual a uma das últimas 5 utilizadas |
| `UNAUTHORIZED` | 401 | Token ausente ou usuário não encontrado |
| `INVALID_CREDENTIALS` | 401 | E-mail ou senha incorretos; inclui `details.passwordChangedAt` (ISO 8601) se a senha foi trocada via reset |
| `EMAIL_ALREADY_EXISTS` | 409 | E-mail já cadastrado |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `INTERNAL_ERROR` | 500 | Erro interno |

---

## Health check

### `GET /health`

**Auth:** nenhuma  
**Response `200`:**
```json
{ "status": "ok", "timestamp": "2026-06-14T00:00:00.000Z" }
```

---

## Auth (`/api/auth/`)

### `POST /api/auth/register`

Cria uma nova conta de usuário.

**Auth:** nenhuma

**Request body:**
```json
{
  "name": "string",     // mínimo 2 caracteres
  "email": "string",    // formato e-mail válido
  "password": "string"  // mínimo 8 caracteres
}
```

**Response `201`:**
```json
{
  "user": UserResponse,
  "token": "eyJ..."     // access token JWT (~15min)
}
```

**Cookie setado:** `bp.refresh` — httpOnly, secure (prod), path `/api/auth`, TTL = `REFRESH_TOKEN_TTL`

**Erros:**
- `400 VALIDATION_ERROR` — campo inválido
- `409 EMAIL_ALREADY_EXISTS` — e-mail já cadastrado

---

### `POST /api/auth/login`

Autentica um usuário existente.

**Auth:** nenhuma

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "user": UserResponse,
  "token": "eyJ..."     // access token JWT
}
```

**Cookie setado:** `bp.refresh` (mesmas opções do register)

**Erros:**
- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS` — e-mail não encontrado ou senha incorreta. Se a senha foi trocada via reset, inclui `details.passwordChangedAt` (ISO 8601) para o front exibir mensagem informativa:
  ```json
  { "error": { "code": "INVALID_CREDENTIALS", "message": "E-mail ou senha incorretos.", "details": { "passwordChangedAt": "2026-06-15T01:00:00.000Z" } } }
  ```

---

### `POST /api/auth/refresh`

Troca o refresh token por um novo access token (com rotação).

**Auth:** cookie `bp.refresh` (httpOnly — enviado automaticamente pelo browser)

**Request body:** nenhum

**Response `200`:**
```json
{
  "token": "eyJ..."    // novo access token
}
```

**Cookie atualizado:** `bp.refresh` com novo refresh token (rotação)

**Erros:**
- `401 UNAUTHORIZED` — cookie ausente
- `401 TOKEN_EXPIRED` — refresh token inválido, expirado ou já utilizado

**Uso no front-end:** interceptar respostas `401` nas chamadas autenticadas e tentar refresh automaticamente antes de redirecionar para login.

---

### `POST /api/auth/logout`

Invalida o refresh token atual e limpa o cookie.

**Auth:** cookie `bp.refresh` (opcional — logout é idempotente)

**Request body:** nenhum

**Response `204`** (sem body)

**Cookie limpo:** `bp.refresh`

---

### `GET /api/auth/me`

Retorna o usuário autenticado pelo access token.

**Auth:** `Authorization: Bearer <access_token>`

**Response `200`:**
```json
UserResponse
```

**Erros:**
- `401 UNAUTHORIZED` — token ausente ou usuário não encontrado
- `401 TOKEN_EXPIRED` — access token expirado

**Uso no front-end:** chamar na hidratação da sessão para obter o usuário atual.

---

### `POST /api/auth/confirm-email`

Confirma o e-mail do usuário via código OTP de 6 dígitos recebido por e-mail.

**Auth:** nenhuma

**Request body:**
```json
{ "code": "123456" }
```

**Response `200`:**
```json
{ "message": "E-mail confirmado com sucesso." }
```

**Erros:**
- `400 INVALID_CODE` — código não encontrado ou inválido
- `400 CODE_ALREADY_USED` — código já utilizado
- `400 CODE_EXPIRED` — código expirado (15 min)

---

### `POST /api/auth/resend-confirmation`

Reenvia o e-mail com novo código OTP. Resposta sempre genérica (não revela se o e-mail existe).

**Auth:** nenhuma

**Rate limit:** não reenvia se já existe código criado no último minuto.

**Request body:**
```json
{ "email": "string" }
```

**Response `200`:**
```json
{ "message": "Se o e-mail existir e não estiver confirmado, um novo código foi enviado." }
```

---

### `POST /api/auth/forgot-password`

Envia e-mail de redefinição de senha. Resposta sempre genérica (não revela se o e-mail existe ou está bloqueado).

**Auth:** nenhuma

**Rate limit:** apenas uma solicitação permitida a cada 24h por conta. Exceder retorna a mesma resposta genérica sem erro.

**Request body:**
```json
{ "email": "string" }
```

**Response `200`:**
```json
{ "message": "Se o e-mail existir, um link de redefinição foi enviado." }
```

---

### `POST /api/auth/reset-password`

Redefine a senha via token. Invalida **todos** os refresh tokens do usuário (logout global).

**Auth:** nenhuma

**Restrições de senha:** a nova senha não pode ser igual a nenhuma das últimas 5 senhas utilizadas (incluindo a senha atual).

**Request body:**
```json
{
  "token": "string",
  "password": "string"   // mínimo 8 caracteres
}
```

**Response `200`:**
```json
{ "message": "Senha redefinida com sucesso. Faça login com a nova senha." }
```

**Erros:**
- `400 INVALID_TOKEN` — token não encontrado
- `400 TOKEN_ALREADY_USED` — token já utilizado
- `400 TOKEN_EXPIRED` — token expirado (1h)
- `400 PASSWORD_ALREADY_USED` — nova senha é igual a uma das últimas 5 utilizadas

---

## Perfil (`/api/users/`)

### `PATCH /api/users/me`

Atualiza nome e bio do usuário autenticado.

**Auth:** `Authorization: Bearer <access_token>`

**Request body:**
```json
{
  "name": "string",    // mínimo 2 caracteres
  "bio": "string"      // opcional, máximo 500 caracteres
}
```

**Response `200`:** `UserResponse` atualizado

**Erros:**
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`

---

### `POST /api/users/me/avatar`

Faz upload de avatar para o Bunny.net Edge Storage e atualiza `avatarUrl` do usuário.

**Auth:** `Authorization: Bearer <access_token>`

**Request:** `multipart/form-data` com campo `file` contendo a imagem

**Restrições:**
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: 2 MB

**Response `200`:** `UserResponse` com `avatarUrl` atualizado

**Erros:**
- `400 BAD_REQUEST` — nenhum arquivo enviado
- `400 INVALID_FILE_TYPE` — tipo de arquivo não permitido
- `401 UNAUTHORIZED`
- `503 STORAGE_NOT_CONFIGURED` — variáveis BUNNY_* não configuradas no servidor

---

### `PATCH /api/users/me/preferences`

Atualiza as preferências de notificação do usuário autenticado.

**Auth:** `Authorization: Bearer <access_token>`

**Request body:**
```json
{
  "emailNotifications": true,  // opcional
  "productUpdates": false      // opcional
}
```

**Response `200`:** `UserResponse` com preferências atualizadas

**Erros:**
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`

---

## Notificações (`/api/notifications/`)

### `GET /api/notifications`

Retorna as últimas 100 notificações do usuário, mais recentes primeiro.

**Auth:** `Authorization: Bearer <access_token>`

**Response `200`:** array de `NotificationResponse`

```typescript
{
  id: string;
  type: "WELCOME" | "EMAIL_VERIFIED" | "PASSWORD_CHANGED" | "PASSWORD_RESET_REQUESTED" | "PROFILE_UPDATED" | "AVATAR_UPDATED";
  title: string;
  body: string;
  readAt: string | null;   // ISO 8601, null se não lida
  createdAt: string;        // ISO 8601
}[]
```

---

### `PATCH /api/notifications/:id/read`

Marca uma notificação específica como lida.

**Auth:** `Authorization: Bearer <access_token>`

**Response `204`:** sem body

**Erros:**
- `404 NOT_FOUND` — notificação não encontrada ou não pertence ao usuário

---

### `PATCH /api/notifications/read-all`

Marca todas as notificações não lidas do usuário como lidas.

**Auth:** `Authorization: Bearer <access_token>`

**Response `204`:** sem body

---

## Tipos de notificação e quando são geradas

| Tipo | Quando é disparada |
|------|--------------------|
| `WELCOME` | Ao criar conta (`POST /api/auth/register`) |
| `EMAIL_VERIFIED` | Ao confirmar e-mail (`POST /api/auth/confirm-email`) |
| `PASSWORD_RESET_REQUESTED` | Ao solicitar redefinição (`POST /api/auth/forgot-password`) |
| `PASSWORD_CHANGED` | Ao redefinir senha (`POST /api/auth/reset-password`) |
| `PROFILE_UPDATED` | Ao atualizar perfil (`PATCH /api/users/me`) |
| `AVATAR_UPDATED` | Ao trocar avatar (`POST /api/users/me/avatar`) |

---

## Endpoints futuros (não implementados)

| Domínio | Método | Rota | Descrição |
|---------|--------|------|-----------|
| Auth | POST | `/api/auth/change-password` | Alterar senha (autenticado) |
| Dashboard | GET | `/api/dashboard` | KPIs + gráfico + faturas recentes |
| Faturas | GET | `/api/invoices` | Listagem paginada e ordenável |
| Faturas | POST | `/api/invoices/:id/duplicate` | Duplicar fatura |
| Faturas | DELETE | `/api/invoices/:id` | Excluir fatura |
| Faturas | GET | `/api/invoices/export` | Exportar CSV/Excel |
