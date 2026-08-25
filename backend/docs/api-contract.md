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
  role: "DOCTOR" | "SALES_REP" | "MANAGER" | "ADMIN";  // padrão "DOCTOR"
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
| `FORBIDDEN` | 403 | Role do usuário não tem permissão para o recurso (`requireRole`) |
| `DOCTOR_NOT_APPROVED` | 403 | Médico autenticado ainda não foi aprovado (`requireApproved`); `details.approvalStatus` = `PENDING` \| `REJECTED` |
| `DOCTOR_PROFILE_NOT_FOUND` | 404 | Usuário não possui `DoctorProfile` |
| `CATALOG_ITEM_NOT_FOUND` | 404 | Item de catálogo inexistente, ou não `PUBLISHED` para quem não é staff/admin |
| `COURSE_FULL` | 409 | Sem vagas para o curso |
| `SEMINAR_FULL` | 409 | Sem vagas para o seminário |
| `LEAD_NOT_FOUND` | 404 | `DoctorProfile` (lead) inexistente |
| `LEAD_ALREADY_ASSIGNED` | 409 | Lead já tem vendedor responsável (`claimLead`) |
| `REFERRAL_NOT_FOUND` | 404 | Indicação inexistente |
| `COMMISSION_ALREADY_PAID` | 409 | Comissão desta indicação já foi lançada (lançamento é único) |
| `FINANCIAL_ENTRY_NOT_FOUND` | 404 | Lançamento financeiro inexistente |
| `COURSE_REGISTRATION_NOT_FOUND` | 404 | Inscrição de interesse (formulário público) inexistente |
| `ENROLLMENT_REQUIRED` | 403 | Médico tentou ver materiais de um curso sem `Order` confirmado nele |
| `COURSE_MATERIAL_NOT_FOUND` | 404 | Material de curso inexistente |
| `ARTICLE_NOT_FOUND` | 404 | Artigo inexistente, ou não publicado para quem não é staff/admin |
| `BANNER_NOT_FOUND` | 404 | Banner inexistente |
| `AMBASSADOR_APPLICATION_NOT_FOUND` | 404 | Candidatura de embaixador inexistente |
| `LEAD_REMINDER_NOT_FOUND` | 404 | Lembrete de agenda do CRM inexistente |
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
  type: "WELCOME" | "EMAIL_VERIFIED" | "PASSWORD_CHANGED" | "PASSWORD_RESET_REQUESTED" | "PROFILE_UPDATED" | "AVATAR_UPDATED" | "DOCTOR_REGISTRATION_RECEIVED" | "NEW_DOCTOR_PENDING" | "DOCTOR_APPROVED" | "DOCTOR_REJECTED" | "ORDER_CREATED" | "LEAD_ASSIGNED" | "LEAD_REVIEW_REQUESTED";
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

## Médicos (`/api/doctors/`)

Fluxo: médico se cadastra → `DoctorProfile` criado com `approvalStatus: "PENDING"` → staff/admin aprova ou rejeita → só então o médico passa em `requireApproved` nas rotas de catálogo/pedidos.

### `POST /api/doctors/register`

Cadastra um novo médico (cria `User{role:"DOCTOR"}` + `DoctorProfile{approvalStatus:"PENDING"}` numa única operação). Já loga o médico (emite tokens), que deve ser direcionado para uma tela de "cadastro em análise" até ser aprovado.

**Auth:** nenhuma

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "crm": "string",          // opcional
  "specialty": "string",    // opcional
  "phone": "string",        // opcional
  "clinicName": "string",   // opcional
  "city": "string",         // opcional
  "state": "string"         // opcional, sigla (2 chars)
}
```

**Response `201`:** `{ user: UserResponse, token: "eyJ..." }` (mesmo shape de `/api/auth/register`)

**Cookie setado:** `bp.refresh` (mesmas opções do auth)

**Erros:** `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`

---

### `GET /api/doctors/me`

Retorna o `DoctorProfile` do médico autenticado (inclui `approvalStatus`) — usado pelo front para decidir entre liberar a área do médico ou mostrar a tela de "em análise".

**Auth:** `Authorization: Bearer <access_token>`

**Response `200`:** `DoctorProfileResponse` (ver shape abaixo)

**Erros:** `404 DOCTOR_PROFILE_NOT_FOUND`

---

### `GET /api/doctors?status=PENDING|APPROVED|REJECTED`

Lista médicos, opcionalmente filtrados por status. `status` omitido retorna todos.

**Auth:** `Authorization: Bearer <access_token>`, role `MANAGER` ou `ADMIN`

**Response `200`:** array de `DoctorProfileResponse`

```typescript
{
  id: string;
  userId: string;
  name: string;
  email: string;
  crm: string | null;
  specialty: string | null;
  phone: string | null;
  clinicName: string | null;
  city: string | null;
  state: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
}
```

**Erros:** `403 FORBIDDEN`

---

### `PATCH /api/doctors/:id/approve`

Aprova o médico. `:id` é o `User.id` do médico (não o id do `DoctorProfile`). Envia e-mail e dispara notificação `DOCTOR_APPROVED`.

**Auth:** `Authorization: Bearer <access_token>`, role `MANAGER` ou `ADMIN`

**Response `200`:** `DoctorProfileResponse` atualizado

**Erros:** `403 FORBIDDEN`, `404 DOCTOR_PROFILE_NOT_FOUND`

---

### `PATCH /api/doctors/:id/reject`

Rejeita o médico, com motivo opcional. Envia e-mail e dispara notificação `DOCTOR_REJECTED`.

**Auth:** `Authorization: Bearer <access_token>`, role `MANAGER` ou `ADMIN`

**Request body:**
```json
{ "reason": "string" }
```

**Response `200`:** `DoctorProfileResponse` atualizado

**Erros:** `403 FORBIDDEN`, `404 DOCTOR_PROFILE_NOT_FOUND`

---

## Catálogo (`/api/catalog/`)

Catálogo unificado — um único recurso com `type: "PRODUCT" | "COURSE" | "SEMINAR"`. `COURSE`/`SEMINAR` usam campos de evento (`startsAt`, `location`, `capacity`, ...); `PRODUCT` usa `sku`/`stockQty`. Médicos só veem itens `PUBLISHED`; staff/admin veem todos os status.

### `GET /api/catalog?type=&status=`

**Auth:** `Authorization: Bearer <access_token>` + `requireApproved` (médico deve estar aprovado; staff/admin sempre passam). Para médicos, `status` é forçado para `PUBLISHED` independente do query param.

**Response `200`:** array de `CatalogItemResponse`

```typescript
{
  id: string;
  type: "PRODUCT" | "COURSE" | "SEMINAR";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;        // Decimal serializado como string
  startsAt: string | null;     // ISO 8601, COURSE/SEMINAR
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  capacity: number | null;
  vagasRestantes: number | null; // calculado: capacity - pedidos CONFIRMED
  instructorUserId: string | null; // COURSE/SEMINAR — médico parceiro instrutor responsável
  instructorName: string | null;
  sku: string | null;           // PRODUCT
  stockQty: number | null;      // PRODUCT
  createdAt: string;
}[]
```

> Nota de produto: o frontend do médico (Cursos, landing pública) deliberadamente **não exibe** `vagasRestantes`/`capacity` — a informação existe na API (staff usa pra gestão), mas fica oculta pra quem não é staff.

**Erros:** `403 DOCTOR_NOT_APPROVED`

---

### `GET /api/catalog/:id`

**Auth:** igual à listagem.

**Response `200`:** `CatalogItemResponse`

**Erros:** `403 DOCTOR_NOT_APPROVED`, `404 CATALOG_ITEM_NOT_FOUND`

---

### `POST /api/catalog`

Cria item de catálogo (sempre `status: "DRAFT"` — publicar é uma atualização separada via `PATCH`). Body é uma união discriminada por `type`.

**Auth:** `Authorization: Bearer <access_token>`, role `MANAGER` ou `ADMIN`

**Request body (`type: "PRODUCT"`):**
```json
{ "type": "PRODUCT", "title": "string", "description": "string", "imageUrl": "string", "price": 0, "sku": "string", "stockQty": 0 }
```

**Request body (`type: "COURSE" | "SEMINAR"`):**
```json
{ "type": "SEMINAR", "title": "string", "startsAt": "2026-09-01T13:00:00Z", "endsAt": "2026-09-01T18:00:00Z", "location": "string", "isOnline": false, "capacity": 30, "price": 0, "instructorUserId": "string" }
```
`instructorUserId` (opcional) referencia um `User` — normalmente um médico (`DOCTOR`) que vira dono do "Painel do Instrutor" pra esse item.

**Response `201`:** `CatalogItemResponse`

**Erros:** `400 VALIDATION_ERROR`, `403 FORBIDDEN`

---

### `PATCH /api/catalog/:id`

Atualização parcial (inclui trocar `status` para publicar/arquivar).

**Auth:** `Authorization: Bearer <access_token>`, role `MANAGER` ou `ADMIN`

**Response `200`:** `CatalogItemResponse`

**Erros:** `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 CATALOG_ITEM_NOT_FOUND`

---

### `PATCH /api/catalog/:id/archive`

Atalho para `status: "ARCHIVED"`. Itens com pedidos nunca podem ser excluídos (FK `onDelete: Restrict`) — arquivar é a forma correta de "remover" um item do catálogo ativo.

**Auth:** `Authorization: Bearer <access_token>`, role `MANAGER` ou `ADMIN`

**Response `200`:** `CatalogItemResponse`

**Erros:** `403 FORBIDDEN`, `404 CATALOG_ITEM_NOT_FOUND`

---

## Pedidos (`/api/orders/`)

Cobre tanto compra de produto quanto inscrição em curso/seminário — um único conceito de "pedido".

### `POST /api/orders`

Cria um pedido. Para `COURSE`/`SEMINAR`, `quantity` é sempre forçado para `1` e a vaga é checada transacionalmente (evita overselling em requisições concorrentes).

**Auth:** `Authorization: Bearer <access_token>`, role `DOCTOR` + `requireApproved`

**Request body:**
```json
{ "catalogItemId": "string", "quantity": 1 }
```

**Response `201`:**
```typescript
{
  id: string;
  catalogItemId: string;
  catalogItemTitle: string;
  catalogItemType: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  unitPrice: string | null;   // snapshot do preço no momento do pedido
  createdAt: string;
}
```

**Erros:**
- `403 FORBIDDEN` — role não é `DOCTOR`
- `403 DOCTOR_NOT_APPROVED`
- `404 CATALOG_ITEM_NOT_FOUND` — item inexistente ou não `PUBLISHED`
- `409 COURSE_FULL` / `409 SEMINAR_FULL` — sem vagas

---

### `GET /api/orders/me`

Lista os pedidos do médico autenticado, mais recentes primeiro.

**Auth:** `Authorization: Bearer <access_token>`, role `DOCTOR` + `requireApproved`

**Response `200`:** array do mesmo shape de `POST /api/orders`

---

## CRM (`/api/crm/`) — Contatos (funil de vendas)

Fase 2, expandido na Fase 4 ("Contatos" — cadastro completo, origem do lead, histórico e agenda). O estágio do funil vive direto no `DoctorProfile` (não é uma entidade separada), mesma ideia do sistema irmão "peptideo". Papéis internos: `SALES_REP` (vendedor — só vê os próprios leads + os sem vendedor), `MANAGER`/`ADMIN` (veem tudo). No frontend esse módulo aparece como **"Contatos"** (`/contatos`), não mais "Funil".

**`FunnelStage`:** `NEW | FIRST_CONTACT | AWAITING_RESPONSE | INFO_RECEIVED | INTERESTED | PAYMENT_LINK_SENT | CUSTOMER | WITHDRAWN | LOST`
(`INFO_RECEIVED` e `WITHDRAWN` adicionados na Fase 4 — antes só existia `LOST` pra qualquer saída do funil.)

**`LeadSource`:** `INSTAGRAM | FACEBOOK | GOOGLE | LINKEDIN | SITE | INDICACAO | CONGRESSO | EVENTO | WHATSAPP_UNINGA | EX_ALUNO | OUTRO`

Novo médico cadastrado (via `/register-medico`) é **atribuído automaticamente** a um vendedor (o com menos leads no momento — equivalente ao round-robin do peptideo, mas autoequilibrado em vez de um cursor rotativo). Contatos criados manualmente pelo CRM (`POST /api/crm/leads`) seguem a mesma regra, exceto quando quem cria já é `SALES_REP` — nesse caso o contato é atribuído a ele mesmo direto. Vendedor **não decide** aprovação/rejeição de médico diretamente — só pode *solicitar* uma decisão (`approvalStatus` vira `IN_REVIEW`); só `MANAGER`/`ADMIN` finalizam via `PATCH /api/doctors/:id/approve|reject` (módulo Médicos).

### `GET /api/crm/leads?funnelStage=&scope=mine|unassigned|all`

**Auth:** `Authorization: Bearer <access_token>`, role `SALES_REP`, `MANAGER` ou `ADMIN`. Para `SALES_REP`, o scoping é sempre aplicado no servidor (nunca retorna leads de outro vendedor, mesmo pedindo `scope=all`).

**Response `200`:** array de `LeadResponse`
```typescript
{
  id: string;                    // DoctorProfile.id
  userId: string;
  name: string; email: string;
  phone: string | null;
  crm: string | null; specialty: string | null;
  profession: string | null;     // "Profissão" — livre, ex.: "Médico(a)", "Nutricionista"
  cpf: string | null;
  clinicName: string | null; city: string | null; state: string | null;
  leadSource: LeadSource | null;
  approvalStatus: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  funnelStage: FunnelStage;
  lossReason: string | null;     // salvo quando funnelStage é "LOST" ou "WITHDRAWN"
  assignedSalesRepId: string | null;
  assignedSalesRepName: string | null;
  reviewRequestedAction: "APPROVE" | "REJECT" | null;
  createdAt: string;
}[]
```

---

### `POST /api/crm/leads`

Cadastro **manual** de contato/lead direto pelo CRM (ex.: chegou por Instagram, WhatsApp, evento) — sem passar pelo formulário público `/register-medico`. Cria um `User` (role `DOCTOR`, `approvalStatus: PENDING`) com senha aleatória (o contato não recebe/usa essa senha; se um dia precisar logar como médico de verdade, usaria o fluxo de "esqueci a senha").

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN`

**Request body:**
```json
{ "name": "string", "email": "string", "phone": "string", "profession": "string", "specialty": "string", "crm": "string", "cpf": "string", "clinicName": "string", "city": "string", "state": "string", "leadSource": "INSTAGRAM" }
```
Só `name` e `email` são obrigatórios.

**Response `201`:** `LeadResponse`

**Erros:** `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`

---

### `PATCH /api/crm/leads/:id`

Edita os dados de cadastro de um contato (tudo exceto nome/e-mail, pra não colidir com o login).

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN`. Vendedor só edita leads atribuídos a ele.

**Request body:** subconjunto parcial de `{ phone, profession, specialty, crm, cpf, clinicName, city, state, leadSource }`

**Response `200`:** `LeadResponse`

---

### `PATCH /api/crm/leads/:id/funnel`

Move o lead pra outro estágio do funil. `:id` é o `DoctorProfile.id`. `lossReason` só é salvo quando `funnelStage` é `"LOST"` ou `"WITHDRAWN"` (limpo automaticamente nos demais estágios).

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN`. Vendedor só move leads atribuídos a ele.

**Request body:**
```json
{ "funnelStage": "INTERESTED", "lossReason": "string" }
```

**Response `200`:** `LeadResponse`

**Erros:** `403 FORBIDDEN` (lead de outro vendedor), `404 LEAD_NOT_FOUND`

---

### `PATCH /api/crm/leads/:id/claim`

Vendedor assume um lead sem vendedor atribuído.

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN`

**Response `200`:** `LeadResponse`

**Erros:** `409 LEAD_ALREADY_ASSIGNED`, `404 LEAD_NOT_FOUND`

---

### `PATCH /api/crm/leads/:id/request-review`

Vendedor solicita a um gerente/admin que aprove ou rejeite o cadastro do médico (não decide diretamente). Marca `approvalStatus: "IN_REVIEW"` e dispara `LEAD_REVIEW_REQUESTED` pra todos `MANAGER`/`ADMIN`.

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN`

**Request body:**
```json
{ "action": "APPROVE" }
```

**Response `200`:** `LeadResponse`

---

### Histórico completo (`/api/crm/leads/:id/activities`)

"Tudo deve ficar registrado" — ligações, WhatsApp, e-mails, observações, envio de forma de pagamento. `LeadActivityType`: `CALL | WHATSAPP | EMAIL | NOTE | PAYMENT_METHOD`.

**`GET /api/crm/leads/:id/activities`** · **`POST /api/crm/leads/:id/activities`**
**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN` (vendedor só acessa leads dele). `POST` body = `{ "type": "WHATSAPP", "note": "string" }`.

**Response:** array de `LeadActivityResponse` (GET) / `LeadActivityResponse` (POST `201`)
```typescript
{ id: string; doctorProfileId: string; type: LeadActivityType; note: string; createdByUserId: string | null; createdByName: string | null; createdAt: string; }
```

---

### Agenda / lembretes (`/api/crm/leads/:id/reminders`)

"Ligar amanhã", "retornar em 7 dias", "cobrar retorno", etc.

**`GET /api/crm/leads/:id/reminders`** · **`POST /api/crm/leads/:id/reminders`** · **`PATCH /api/crm/leads/:id/reminders/:reminderId`**
**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN` (vendedor só acessa leads dele). `POST` body = `{ "label": "string", "dueAt": "2026-08-26T13:00:00Z" }`. `PATCH` body = `{ "done": true }` (marca feito/não feito).

**Response:** `LeadReminderResponse`
```typescript
{ id: string; doctorProfileId: string; label: string; dueAt: string; done: boolean; createdByUserId: string | null; createdByName: string | null; createdAt: string; }
```

**Erros comuns da seção:** `403 FORBIDDEN`, `404 LEAD_NOT_FOUND`, `404 LEAD_REMINDER_NOT_FOUND`

---

## Indicações (`/api/referrals/`)

Um médico aprovado indica um **paciente** ou **outro médico**. Comissão é lançamento manual único (não recorrente/percentual) que **gera automaticamente uma saída no financeiro**.

**`ReferralType`:** `PATIENT | DOCTOR`
**Status (paciente):** `IN_PROGRESS | NEGOTIATION | PAID | CANCELLED`
**Status (médico):** `NEW | CONTACTED | CONVERTED | REJECTED`

> Diferença deliberada do peptideo: lá a indicação é feita via link público com token (`/indicar/{token}`), sem login. Aqui o médico envia de dentro da área autenticada (`POST /api/referrals`) — evita manter um segundo sistema de autenticação só pra esse formulário. O compartilhamento por WhatsApp continua existindo no front, só que como texto pré-preenchido, não como link rastreável.

### `POST /api/referrals`

**Auth:** role `DOCTOR` + `requireApproved`

**Request body (`type: "PATIENT"`):**
```json
{ "type": "PATIENT", "firstName": "string", "lastName": "string", "whatsapp": "string", "email": "string", "address": "string", "notes": "string" }
```
**Request body (`type: "DOCTOR"`):** igual + `"crm": "string"` (obrigatório)

**Response `201`:** `ReferralResponse`
```typescript
{
  id: string; referringDoctorProfileId: string; referringDoctorName: string;
  type: "PATIENT" | "DOCTOR";
  firstName: string; lastName: string; whatsapp: string; email: string | null; address: string | null;
  crm: string | null;
  patientStatus: "IN_PROGRESS" | "NEGOTIATION" | "PAID" | "CANCELLED" | null;
  doctorStatus: "NEW" | "CONTACTED" | "CONVERTED" | "REJECTED" | null;
  notes: string | null;
  commissionAmount: string | null;
  commissionPaid: boolean;
  createdAt: string;
}
```

---

### `GET /api/referrals/me`

Indicações feitas pelo próprio médico autenticado.

**Auth:** role `DOCTOR` + `requireApproved` — **Response `200`:** array de `ReferralResponse`

---

### `GET /api/referrals?type=`

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN`. Vendedor só vê indicações de médicos atribuídos a ele (`assignedSalesRepId`).

---

### `PATCH /api/referrals/:id/status`

Atualiza `patientStatus` ou `doctorStatus` (o campo certo é escolhido pelo `type` da indicação; enviar um status do tipo errado retorna `400 VALIDATION_ERROR`).

**Auth:** role `SALES_REP`/`MANAGER`/`ADMIN` (vendedor só nas suas)

**Request body:** `{ "status": "NEGOTIATION" }`

---

### `PUT /api/referrals/:id/commission`

Lança a comissão — **uma única vez** (409 se já paga). Cria automaticamente um `FinancialEntry` tipo `EXPENSE`, categoria `"Comissão"`.

**Auth:** role `MANAGER`/`ADMIN` (decisão financeira — vendedor não lança)

**Request body:** `{ "amount": 150 }`

**Erros:** `409 COMMISSION_ALREADY_PAID`

---

## Inscrição pública em curso/seminário (`/api/catalog/`)

Pra médicos parceiros que ainda **não têm conta** na plataforma — formulário público sem login, gera um `CourseRegistration` (lead vinculado ao curso), não cria `User`/`DoctorProfile`. Diferente do fluxo de `Order` (que exige conta aprovada) — as duas listas juntas (`CourseRegistration` + `Order`) dão o roster completo de quem está interessado/inscrito num curso.

**`CourseRegistrationStatus`:** `NEW | CONTACTED | CONFIRMED | DECLINED`

### `GET /api/catalog/public/:slug`

Dados públicos do curso/seminário pra montar a página de divulgação. Só retorna itens `PUBLISHED` do tipo `COURSE`/`SEMINAR`.

**Auth:** nenhuma

**Response `200`:**
```typescript
{
  id: string; type: "COURSE" | "SEMINAR"; title: string; slug: string;
  description: string | null; imageUrl: string | null; price: string | null;
  startsAt: string | null; endsAt: string | null; location: string | null;
  isOnline: boolean; vagasRestantes: number | null;
}
```

**Erros:** `404 CATALOG_ITEM_NOT_FOUND`

---

### `POST /api/catalog/:id/register-interest`

Registra o interesse (não cria conta). `:id` é o `CatalogItem.id` do curso/seminário.

**Auth:** nenhuma

**Request body:**
```json
{ "name": "string", "email": "string", "crm": "string", "whatsapp": "string", "notes": "string" }
```

**Response `201`:** `CourseRegistrationResponse` — `{ id, catalogItemId, name, email, crm, whatsapp, notes, status, createdAt }`

**Erros:** `400 VALIDATION_ERROR`, `404 CATALOG_ITEM_NOT_FOUND` (item não existe, não publicado, ou não é curso/seminário)

---

### `GET /api/catalog/:id/registrations`

Lista os interessados via formulário público de um curso.

**Auth:** autenticado + aprovado. Staff (`MANAGER`/`ADMIN`) sempre acessa; médico só se for `instructorUserId` daquele item — senão `403 FORBIDDEN`.

**Response `200`:** array de `CourseRegistrationResponse`

---

### `PATCH /api/catalog/:id/registrations/:regId`

Atualiza o status de acompanhamento de um interessado (ex.: depois de contatar por WhatsApp).

**Auth:** igual ao GET acima (staff ou instrutor do curso).

**Request body:** `{ "status": "CONTACTED" }`

---

### `GET /api/catalog/:id/orders`

Roster de médicos que **já têm conta** e se inscreveram de verdade (via `Order` confirmado) naquele curso.

**Auth:** staff ou instrutor do curso (mesma regra acima).

**Response `200`:**
```typescript
{ orderId: string; doctorProfileId: string; name: string; email: string; crm: string | null; phone: string | null; createdAt: string; }[]
```

---

### `GET /api/catalog/instructor/mine`

Cursos/seminários onde o médico autenticado é `instructorUserId` — alimenta o "Painel do Instrutor" (`/medico/painel-instrutor`).

**Auth:** autenticado + aprovado — **Response `200`:** array de `CatalogItemResponse`

---

## Materiais do curso (`/api/catalog/:id/materials`)

Vídeos/PDFs/links liberados dentro de um curso.

### `GET /api/catalog/:id/materials`
**Auth:** autenticado + aprovado. Staff e o instrutor do curso sempre veem; outro médico só vê se tiver `Order` `CONFIRMED` nesse item — senão `403 ENROLLMENT_REQUIRED`.

**Response `200`:**
```typescript
{ id: string; catalogItemId: string; title: string; type: "VIDEO" | "PDF" | "LINK"; url: string; order: number; createdAt: string; }[]
```

### `POST /api/catalog/:id/materials` · `PATCH /api/catalog/:id/materials/:materialId` · `DELETE /api/catalog/:id/materials/:materialId`
CRUD de materiais. **Auth:** `MANAGER`/`ADMIN` ou o instrutor responsável pelo curso (senão `403 FORBIDDEN`). `POST` body = `{ title, type, url, order? }`; `PATCH` aceita subconjunto parcial.

---

## Blog / Artigos científicos (`/api/articles/`)

Área de conteúdo da região do médico — mesma ideia do peptideo (texto simples com `white-space: pre-wrap`, vídeo opcional via YouTube, materiais pra download), sem rota pública própria nem slug.

### `GET /api/articles?category=`
**Auth:** autenticado + aprovado. Médico só vê `published: true`; staff (`MANAGER`/`ADMIN`) vê tudo (inclui rascunhos).

**Response `200`:** array de `ArticleResponse`
```typescript
{ id: string; title: string; content: string; coverImageUrl: string | null; videoUrl: string | null; category: string | null; materials: { name: string; url: string }[]; published: boolean; publishedAt: string | null; createdAt: string; }[]
```

### `GET /api/articles/:id`
Mesma regra de visibilidade do list. `404 ARTICLE_NOT_FOUND` se não existir ou (pra não-staff) não estiver publicado.

### `POST /api/articles` · `PATCH /api/articles/:id` · `DELETE /api/articles/:id`
CRUD de artigos. **Auth:** `MANAGER`/`ADMIN`. `POST` body = `{ title, content, coverImageUrl?, videoUrl?, category?, materials?, published? }`. Primeira vez que `published` vira `true` seta `publishedAt`.

---

## Banners (`/api/banners/`)

Carrossel full-bleed exibido no topo da Loja e do Blog — pools independentes por `placement` (`LOJA` | `BLOG`), igual ao peptideo (lá são dois JSONs separados; aqui é o mesmo model com um enum).

### `GET /api/banners?placement=`
**Auth:** autenticado + aprovado. Médico só vê `active: true`; staff vê todos (pra gestão), ordenado por `order` asc.

**Response `200`:**
```typescript
{ id: string; placement: "LOJA" | "BLOG"; imageUrl: string; title: string | null; subtitle: string | null; active: boolean; order: number; createdAt: string; }[]
```

### `POST /api/banners` · `PATCH /api/banners/:id` · `DELETE /api/banners/:id`
CRUD de banners. **Auth:** `MANAGER`/`ADMIN`. `POST` body = `{ placement, imageUrl, title?, subtitle?, active?, order? }`.

---

## Embaixadores (`/api/ambassadors/`)

Candidatura ao Programa de Embaixadores AAI — formulário público (`/embaixadores`, sem login, sem criar conta), mesmo padrão de `CourseRegistration`. Gestão em `/gestao-embaixadores` (staff).

### `POST /api/ambassadors/apply`
**Auth:** nenhuma

**Request body:**
```json
{ "name": "string", "email": "string", "whatsapp": "string", "profileType": "string", "alreadyKnowsAai": true, "availableForLives": true, "hasNetwork": false, "notes": "string" }
```

**Response `201`:** `AmbassadorApplicationResponse`
```typescript
{ id: string; name: string; email: string; whatsapp: string; profileType: string; alreadyKnowsAai: boolean; availableForLives: boolean; hasNetwork: boolean; notes: string | null; status: "NEW" | "CONTACTED" | "APPROVED" | "REJECTED"; createdAt: string; }
```

### `GET /api/ambassadors` · `PATCH /api/ambassadors/:id/status`
**Auth:** `MANAGER`/`ADMIN`. `PATCH` body = `{ "status": "APPROVED" }`. Sem endpoint de delete (mesmo padrão de `CourseRegistration` — rejeitar é uma mudança de status, não uma remoção).

---

## Financeiro (`/api/finance/`)

Ledger simples (sem contas/categorias fixas em enum — categoria é texto livre, com uma lista sugerida gerenciável). Restrito a `MANAGER`/`ADMIN` — vendedor não vê financeiro (mesma regra do peptideo).

**Dois gatilhos automáticos** (sem ação manual):
1. **Pedido criado** (`POST /api/orders`) → entrada automática, categoria `"PEDIDO PAGO"` (sem gateway de pagamento ainda na Fase 2, pedido confirmado já conta como pago).
2. **Comissão lançada** (`PUT /api/referrals/:id/commission`) → saída automática, categoria `"Comissão"`.

### `GET /api/finance/entries?type=&from=&to=`
**Auth:** `MANAGER`/`ADMIN` — **Response `200`:** array de `FinancialEntryResponse`
```typescript
{ id: string; type: "INCOME" | "EXPENSE"; category: string; description: string; amount: string; entryDate: string; receiptUrl: string | null; createdByUserId: string | null; createdAt: string; }[]
```

### `GET /api/finance/summary`
**Auth:** `MANAGER`/`ADMIN` — **Response `200`:**
```typescript
{ totalIncome: string; totalExpense: string; balance: string; byCategoryIncome: { category: string; total: string }[]; byCategoryExpense: { category: string; total: string }[]; }
```

### `POST /api/finance/entries` · `PATCH /api/finance/entries/:id` · `DELETE /api/finance/entries/:id`
CRUD manual de lançamentos. **Auth:** `MANAGER`/`ADMIN`. `POST` body = `{ type, category, description, amount, entryDate, receiptUrl? }`; `PATCH` aceita subconjunto parcial.

### `GET /api/finance/categories` · `POST /api/finance/categories`
Lista/cria categorias sugeridas (não são um enum fixo — `FinancialEntry.category` é texto livre; isto só alimenta autocomplete no front). **Auth:** `MANAGER`/`ADMIN`.

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
| `DOCTOR_REGISTRATION_RECEIVED` | Ao médico se cadastrar (`POST /api/doctors/register`), para o próprio médico |
| `NEW_DOCTOR_PENDING` | Ao médico se cadastrar, fan-out para todos os `MANAGER`/`ADMIN` |
| `DOCTOR_APPROVED` | Ao aprovar médico (`PATCH /api/doctors/:id/approve`) |
| `DOCTOR_REJECTED` | Ao rejeitar médico (`PATCH /api/doctors/:id/reject`) |
| `ORDER_CREATED` | Ao criar pedido (`POST /api/orders`) |
| `LEAD_ASSIGNED` | Ao médico se cadastrar, pro vendedor escolhido no round-robin |
| `LEAD_REVIEW_REQUESTED` | Ao vendedor solicitar revisão (`PATCH /api/crm/leads/:id/request-review`), fan-out pra `MANAGER`/`ADMIN` |
| `NEW_COURSE_REGISTRATION` | Ao registrar interesse via formulário público (`POST /api/catalog/:id/register-interest`), fan-out pra `MANAGER`/`ADMIN` |

---

## Auditoria (`AuditLog`)

Toda mutação de CRM/financeiro/aprovação dispara um registro fire-and-forget em `AuditLog` (`actorLabel`, `action`, `detail`, `createdAt`) — sem endpoint de leitura na Fase 2 (só a tabela existe; uma tela de histórico fica pra Fase 3 se for necessário).

---

## Endpoints futuros (não implementados)

Fase 3 (refinamentos): tela de auditoria, upload de comprovante financeiro (hoje é só `receiptUrl` texto), link público rastreável de indicação, comissão percentual automática.

| Domínio | Método | Rota | Descrição |
|---------|--------|------|-----------|
| Auth | POST | `/api/auth/change-password` | Alterar senha (autenticado) |
| Dashboard | GET | `/api/dashboard` | KPIs + gráfico + faturas recentes |
| Faturas | GET | `/api/invoices` | Listagem paginada e ordenável |
| Faturas | POST | `/api/invoices/:id/duplicate` | Duplicar fatura |
| Faturas | DELETE | `/api/invoices/:id` | Excluir fatura |
| Faturas | GET | `/api/invoices/export` | Exportar CSV/Excel |
| Catálogo | GET | `/api/catalog/:id/orders` | Staff/admin: quem comprou/se inscreveu num item |
| CRM | * | `/api/crm/*` | Funil kanban, leads, deals |
| CRM | * | `/api/partners/*` | Indicações/parcerias |
| CRM | * | `/api/finance/*` | Financeiro |
| CRM | * | `/api/team/*` | Portal de equipe |
