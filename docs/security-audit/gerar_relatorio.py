# -*- coding: utf-8 -*-
"""
Gerador do relatório de auditoria de segurança (America Anatomy Institute).
Rode com o Python do venv local: ./venv/Scripts/python.exe gerar_relatorio.py
Regenera relatorio-auditoria-seguranca.pdf nesta mesma pasta.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas as pdfcanvas
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")

# ---------------------------------------------------------------------------
# Paleta
# ---------------------------------------------------------------------------
SEV_COLORS = {
    "Crítica": "#B91C1C",
    "Alta": "#EA580C",
    "Média": "#D97706",
    "Baixa": "#2563EB",
    "Informativa": "#6B7280",
    "Ponto forte": "#059669",
}
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6B7280")
LINE = colors.HexColor("#E5E7EB")
BG_SOFT = colors.HexColor("#F9FAFB")

def hexcol(h):
    return colors.HexColor(h)

def esc(s):
    """Escapa texto pra uso seguro dentro de reportlab Paragraph (mini-XML)."""
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

def esc_br(s):
    """Como esc(), mas também troca quebras de linha por <br/> (pra blocos de código)."""
    return esc(s).replace("\n", "<br/>")

# ---------------------------------------------------------------------------
# Dados da auditoria
# ---------------------------------------------------------------------------
FINDINGS = [
    {
        "id": "F1",
        "sev": "Crítica",
        "categoria": "Chaves/Credenciais expostas",
        "arquivo": "backend/prisma/seed.ts:4-8, 28",
        "titulo": "Credenciais admin de demonstração ativas no banco agora em produção",
        "descricao": (
            "O seed cria contas com senha fraca e documentada no próprio código-fonte "
            "(admin@demo.com / demo1234, role ADMIN; gerente@demo.com, vendedor@demo.com, "
            "medico@demo.com, pendente@demo.com — todas com a mesma senha). Esse é o MESMO "
            "banco Supabase que agora está atrás do backend publicado em produção na Vercel "
            "(america-anatomy-backend.vercel.app). Qualquer pessoa que leia o repositório "
            "público — ou tente credenciais padrão comuns — consegue logar como ADMIN."
        ),
        "porque": (
            "Acesso ADMIN completo: gestão de médicos, contatos do CRM, financeiro e catálogo. "
            "É o achado de maior impacto porque não depende de nenhuma outra falha — é login "
            "direto, documentado, e a conta já existe no ambiente real."
        ),
        "codigo": '/*\n *   Admin:  admin@demo.com   / demo1234  (role ADMIN)\n *   ...\n */\nconst passwordHash = await hash("demo1234");',
    },
    {
        "id": "F2",
        "sev": "Alta",
        "categoria": "Autenticação / Rate limiting",
        "arquivo": "backend/src/modules/auth/auth.routes.ts:17-26",
        "titulo": "Nenhum rate limiting nos endpoints de autenticação",
        "descricao": (
            "/api/auth/login, /api/auth/confirm-email, /api/auth/forgot-password e "
            "/api/auth/resend-confirmation não têm nenhum controle de taxa (nenhuma lib de "
            "rate limit está instalada no projeto — confirmado em package.json). Nada impede "
            "tentativas automatizadas e paralelas de login ou de adivinhação de código de "
            "verificação."
        ),
        "porque": (
            "Combinado ao achado F1 (senhas fracas conhecidas) e F3 (OTP de 6 dígitos), a "
            "ausência de rate limit torna o brute force prático, especialmente hospedado em "
            "funções serverless onde a concorrência é barata para um atacante."
        ),
        "codigo": 'app.post("/api/auth/login", handleLogin);\napp.post("/api/auth/confirm-email", handleConfirmEmail);',
    },
    {
        "id": "F3",
        "sev": "Alta",
        "categoria": "Autenticação / IDOR-like",
        "arquivo": "backend/src/modules/auth/auth.service.ts:218-244",
        "titulo": "Código de confirmação de e-mail não é vinculado a um usuário específico",
        "descricao": (
            "confirmEmail(input) recebe só { code }. O código de 6 dígitos (1.000.000 de "
            "combinações, gerado por generateOtpCode em backend/src/lib/token.ts) é buscado "
            "no banco só pelo hash do código — não é exigido e-mail nem qualquer vínculo com "
            "a sessão que originou o cadastro. Sem rate limit (F2), um código válido de "
            "QUALQUER usuário pendente pode ser encontrado por tentativa e erro."
        ),
        "porque": (
            "Permite marcar o e-mail de outro usuário como verificado sem provar posse dele — "
            "quebra a garantia central de um fluxo de verificação de e-mail."
        ),
        "codigo": (
            "const tokenHash = hashToken(input.code);\n"
            'const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });\n'
            "// nenhuma checagem de email/userId do chamador"
        ),
    },
    {
        "id": "F4",
        "sev": "Média",
        "categoria": "Inputs sem tratamento (XSS)",
        "arquivo": (
            "frontend/src/routes/_medico.medico.cursos.$id.tsx:157; "
            "_app.gestao-cursos.$id.tsx:205; _medico.medico.blog.$id.tsx:92"
        ),
        "titulo": "URL de material de curso/artigo aceita esquema javascript: sem validação",
        "descricao": (
            "createCourseMaterialSchema usa z.string().url() (catalog.schemas.ts), que aceita "
            'qualquer URL sintaticamente válida — incluindo "javascript:alert(document.cookie)". '
            "O valor vai direto para href={m.url} num <a target=\"_blank\">. Materiais de curso "
            "podem ser criados por MANAGER/ADMIN ou pelo médico definido como instrutor "
            "responsável do curso (assertCourseAccess em catalog.service.ts) — não só staff de "
            "confiança máxima."
        ),
        "porque": (
            "Um instrutor (conta DOCTOR) mal-intencionado ou comprometido pode injetar um link "
            "que executa script no navegador de outro médico que clicar nele, dentro da sessão "
            "autenticada dessa vítima (token de acesso acessível via localStorage)."
        ),
        "codigo": '<a href={m.url} target="_blank" rel="noreferrer">\n  {m.title}\n</a>',
    },
    {
        "id": "F5",
        "sev": "Média",
        "categoria": "Inputs sem tratamento (XSS)",
        "arquivo": "backend/src/lib/email/templates.ts (múltiplas funções)",
        "titulo": "Nome do usuário e motivo de rejeição interpolados sem escape no HTML do e-mail",
        "descricao": (
            "confirmCodeTemplate, resetPasswordTemplate, doctorPendingApprovalTemplate, "
            "doctorApprovedTemplate e doctorRejectedTemplate colocam ${data.name} (e "
            "${data.reason}, digitado por um MANAGER/ADMIN ao rejeitar um médico) direto numa "
            "template string HTML, sem nenhuma função de escape. Não há lib de sanitização "
            "(dompurify, sanitize-html, etc.) no projeto. name vem de registerSchema/"
            "doctorRegisterSchema, que só valida tamanho — nenhuma restrição de caracteres."
        ),
        "porque": (
            "É possível registrar uma conta com nome contendo HTML/JS e ele será embutido cru "
            "no e-mail. O caso mais claro de impacto cruzado é reason (staff → médico "
            "rejeitado): um HTML malicioso digitado no motivo de rejeição chega no e-mail do "
            "médico. Mesmo sem execução de script (clientes de e-mail modernos costumam "
            "bloquear <script>), a injeção de HTML/CSS permite phishing (trocar o texto de um "
            "link, esconder avisos)."
        ),
        "codigo": '<h1>Bem-vindo, ${data.name}!</h1>\n...\n${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ""}',
    },
    {
        "id": "F6",
        "sev": "Baixa",
        "categoria": "Inputs sem tratamento / Upload",
        "arquivo": "backend/src/modules/users/users.controller.ts:15-32",
        "titulo": "Validação de tipo de arquivo do avatar confia no Content-Type declarado pelo cliente",
        "descricao": (
            "handleUploadAvatar valida data.mimetype (cabeçalho enviado pelo próprio cliente no "
            "multipart), não o conteúdo real do arquivo. Um arquivo com bytes de outro formato "
            "pode ser enviado se o cliente declarar Content-Type: image/png. O impacto direto é "
            "limitado hoje porque avatarUrl é sempre renderizado via <img src=...> em todo o "
            "frontend (nunca como iframe/HTML), o que não executa conteúdo malicioso — mas é um "
            "padrão de validação inseguro (CWE-434) que pode virar um vetor de verdade se o "
            "arquivo passar a ser servido/aberto de outra forma no futuro."
        ),
        "porque": (
            "Confiar em Content-Type declarado pelo cliente é uma validação que pode ser "
            "contornada — o correto é inspecionar os bytes reais (magic number) do arquivo."
        ),
        "codigo": (
            "const mimeType = data.mimetype as string;\n"
            "if (!ALLOWED_AVATAR_TYPES.includes(mimeType as ...)) { throw ... }\n"
            "// mimeType vem do cabeçalho enviado pelo cliente, não do conteúdo do arquivo"
        ),
    },
    {
        "id": "F7",
        "sev": "Informativa",
        "categoria": "Autenticação / Hardening",
        "arquivo": "backend/src/lib/jwt.ts:26-28",
        "titulo": "jwt.verify() não fixa a lista de algoritmos aceitos",
        "descricao": (
            'verifyAccessToken chama jwt.verify(token, env.JWT_ACCESS_SECRET) sem o parâmetro '
            "algorithms. Não é explorável hoje porque o projeto não usa chaves assimétricas "
            "(RS256) em nenhum lugar — não há chave pública para o clássico ataque de confusão "
            "de algoritmo. Ainda assim, é uma boa prática de defesa em profundidade fixar "
            'algorithms: ["HS256"] explicitamente, para que o comportamento fique correto por '
            "design e não por acidente de configuração atual."
        ),
        "porque": (
            "Reduz a superfície de erro futuro caso o projeto evolua para aceitar chaves "
            "assimétricas ou outra biblioteca com comportamento padrão diferente."
        ),
        "codigo": "export function verifyAccessToken(token: string): AccessTokenPayload {\n  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;\n}",
    },
]

STRENGTHS = [
    ("Isolamento por papel no CRM", "crm.service.ts",
     "assertLeadAccess/updateLead/updateFunnelStage/claimLead checam explicitamente "
     "que um SALES_REP só acessa leads com assignedSalesRepId igual ao próprio ator — "
     "verificado em TODOS os handlers de :id do módulo CRM, não só numa amostra."),
    ("IDOR em notificações", "notifications.service.ts",
     "markNotificationRead verifica notification.userId !== userId antes de marcar como "
     "lida, retornando 404 genérico em vez de vazar a existência do registro de outro usuário."),
    ("Pedidos sempre autoescopados", "orders.service.ts",
     "createOrder/listMyOrders resolvem o doctorProfileId a partir do req.user.id do token — "
     "o cliente nunca informa de quem é o pedido, eliminando IDOR por design."),
    ("Materiais e roster de curso", "catalog.service.ts",
     "assertCourseAccess (staff OU instrutor responsável daquele curso específico) é chamada "
     "em TODOS os handlers de materiais/registrations/roster antes de qualquer leitura ou "
     "escrita — inclusive resolvendo o catalogItemId correto a partir do id do sub-recurso."),
    ("Permissão de escrita no backend, não só na UI", "*.routes.ts (10 módulos)",
     "Toda rota de criação/edição/exclusão sensível (catálogo, financeiro, blog, banners, "
     "exclusão de médico) tem requireRole no preHandler do Fastify — não depende da UI "
     "esconder botões por papel."),
    ("Nenhum segredo hardcoded", "repositório completo + histórico git",
     "Busca por padrões de chave/segredo no código-fonte não encontrou nada; nenhum arquivo "
     ".env real foi commitado em nenhum momento do histórico do git."),
    ("Validação de ambiente que falha ao iniciar", "backend/src/config/env.ts",
     "JWT_ACCESS_SECRET, JWT_REFRESH_SECRET e COOKIE_SECRET são obrigatórios com mínimo de 32 "
     "caracteres via zod — sem valor padrão inseguro. O servidor chama process.exit(1) e recusa "
     "subir se estiverem ausentes ou curtos demais."),
    ("Frontend sem segredo embutido", "frontend/src/lib",
     "Única variável VITE_* usada é VITE_API_URL (uma URL pública por natureza); nenhum "
     "arquivo .env é versionado no frontend."),
    ("Sem HTML perigoso no React", "frontend/src (varredura completa)",
     "Único uso de dangerouslySetInnerHTML é um script estático de tema (sem dado de usuário); "
     "conteúdo de artigo é sempre renderizado como texto JSX puro (auto-escapado); o ID do "
     "vídeo do YouTube é extraído com regex restritiva ([\\w-]{6,}), sem chance de quebrar o "
     "atributo src."),
    ("Cadastro nunca aceita role do cliente", "auth.schemas.ts / doctors.schemas.ts",
     "Nenhum schema de registro (público ou de médico) aceita o campo role — o servidor sempre "
     "define DOCTOR por padrão, eliminando auto-elevação de privilégio no cadastro."),
    ("Middlewares de autorização falham fechado", "authenticate.ts / require-role.ts / require-approved.ts",
     "Token ausente, inválido ou expirado sempre resulta em 401; papel fora da lista permitida "
     "sempre resulta em 403 — nenhum caminho identificado que permita passagem por erro ou "
     "exceção não tratada."),
]

RECOMMENDATIONS = [
    ("P1", "Trocar/desativar as contas de demonstração no banco de produção agora (F1)",
     "Rotacionar a senha de admin@demo.com e das demais contas *@demo.com no banco em uso "
     "pela Vercel, ou desativá-las, antes de divulgar a URL de produção."),
    ("P1", "Adicionar rate limiting nos endpoints de autenticação (F2)",
     "@fastify/rate-limit (ou equivalente) em /api/auth/login, /confirm-email, "
     "/forgot-password e /resend-confirmation, por IP e por conta."),
    ("P1", "Vincular o código de confirmação de e-mail à sessão/usuário (F3)",
     "Exigir o e-mail junto com o código em confirmEmailSchema, ou usar um token de alta "
     "entropia como no fluxo de redefinição de senha."),
    ("P2", "Bloquear esquemas perigosos em URLs de material (F4)",
     'Validar com uma allowlist de protocolo (http/https) em vez de z.string().url() puro, '
     "tanto em createCourseMaterialSchema quanto no schema de materiais de artigo do blog."),
    ("P2", "Escapar variáveis antes de interpolar em HTML de e-mail (F5)",
     "Aplicar uma função de escape simples (ou uma lib como escape-html) em todo dado dinâmico "
     "usado dentro de baseTemplate/confirmCodeTemplate/etc."),
    ("P3", "Validar o conteúdo real do arquivo de avatar, não só o Content-Type (F6)",
     "Checar magic bytes do buffer recebido (ex.: file-type) além do mimetype declarado."),
    ("P3", "Fixar algorithms: [\"HS256\"] no jwt.verify() (F7)",
     "Ajuste de dureza defensiva, sem exploração conhecida no estado atual do projeto."),
]

GITHUB_ISSUES = [
    {
        "title": "[Segurança] Credenciais admin de demonstração ativas no banco de produção",
        "labels": "security, critical",
        "body": (
            "## Problema\n"
            "O seed (`backend/prisma/seed.ts`) cria contas com senhas fracas e documentadas no "
            "próprio código-fonte, incluindo `admin@demo.com` / `demo1234` com papel `ADMIN`. "
            "Esse é o mesmo banco Supabase usado pelo backend agora publicado em produção "
            "(`america-anatomy-backend.vercel.app`).\n\n"
            "## Por que é explorável\n"
            "Qualquer pessoa com acesso ao repositório (ou que tente credenciais padrão comuns) "
            "consegue logar como ADMIN em produção — acesso completo a CRM, financeiro e catálogo.\n\n"
            "## Evidência\n"
            "`backend/prisma/seed.ts:4-8, 28`\n"
            "```ts\n"
            '// *   Admin: admin@demo.com / demo1234 (role ADMIN)\n'
            'const passwordHash = await hash("demo1234");\n'
            "```\n\n"
            "## Impacto\n"
            "Tomada de conta ADMIN completa no ambiente de produção.\n\n"
            "## Sugestão de correção\n"
            "Rotacionar/desativar todas as contas `*@demo.com` no banco de produção, ou usar um "
            "processo de seed separado para dev/prod que nunca crie credenciais fracas em prod.\n\n"
            "## Critérios de aceite\n"
            "- [ ] Nenhuma conta com senha do seed de demonstração existe no banco de produção\n"
            "- [ ] Login com `admin@demo.com`/`demo1234` falha em produção\n"
            "- [ ] Processo de seed documentado para não repetir isso em deploys futuros"
        ),
    },
    {
        "title": "[Segurança] Ausência de rate limiting nos endpoints de autenticação",
        "labels": "security, high",
        "body": (
            "## Problema\n"
            "Nenhum endpoint de autenticação (`/api/auth/login`, `/confirm-email`, "
            "`/forgot-password`, `/resend-confirmation`) tem controle de taxa. Nenhuma lib de "
            "rate limit está instalada no backend.\n\n"
            "## Por que é explorável\n"
            "Habilita brute force de senha e de código de verificação sem qualquer fricção, "
            "especialmente barato em infraestrutura serverless.\n\n"
            "## Evidência\n"
            "`backend/src/modules/auth/auth.routes.ts:17-26`\n"
            "```ts\n"
            'app.post("/api/auth/login", handleLogin);\n'
            'app.post("/api/auth/confirm-email", handleConfirmEmail);\n'
            "```\n\n"
            "## Impacto\n"
            "Brute force de credenciais e de códigos OTP.\n\n"
            "## Sugestão de correção\n"
            "Adicionar `@fastify/rate-limit` (por IP e por conta) nas rotas de autenticação.\n\n"
            "## Critérios de aceite\n"
            "- [ ] Requisições em excesso a `/api/auth/login` retornam 429 após N tentativas\n"
            "- [ ] Mesmo controle aplicado a confirm-email/forgot-password/resend-confirmation\n"
            "- [ ] Limite documentado (ex.: N tentativas por minuto por IP+conta)"
        ),
    },
    {
        "title": "[Segurança] Código de confirmação de e-mail não vinculado a um usuário específico",
        "labels": "security, high",
        "body": (
            "## Problema\n"
            "`confirmEmail` recebe só `{ code }` (6 dígitos, 1.000.000 de combinações) e busca "
            "no banco só pelo hash do código, sem exigir e-mail/userId do chamador.\n\n"
            "## Por que é explorável\n"
            "Sem rate limit (ver issue relacionada), um código válido de qualquer usuário "
            "pendente pode ser encontrado por tentativa e erro, permitindo marcar o e-mail de "
            "outra pessoa como verificado.\n\n"
            "## Evidência\n"
            "`backend/src/modules/auth/auth.service.ts:218-224`\n"
            "```ts\n"
            "const tokenHash = hashToken(input.code);\n"
            "const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });\n"
            "// nenhuma checagem de email/userId do chamador\n"
            "```\n\n"
            "## Impacto\n"
            "Verificação de e-mail de outro usuário sem provar posse da caixa de entrada.\n\n"
            "## Sugestão de correção\n"
            "Exigir o e-mail junto ao código em `confirmEmailSchema` e cruzar com `record.userId`, "
            "ou migrar para um token de alta entropia como no fluxo de redefinição de senha.\n\n"
            "## Critérios de aceite\n"
            "- [ ] `POST /api/auth/confirm-email` exige e-mail + código\n"
            "- [ ] Código válido de outro e-mail é rejeitado\n"
            "- [ ] Teste automatizado cobre o caso de código correto com e-mail errado"
        ),
    },
    {
        "title": "[Segurança] URLs de material de curso/artigo aceitam esquema javascript:",
        "labels": "security, medium",
        "body": (
            "## Problema\n"
            "`createCourseMaterialSchema` usa `z.string().url()`, que aceita qualquer URL "
            'sintaticamente válida — incluindo `javascript:...`. O valor vai direto para '
            '`href={m.url}` num link clicável.\n\n'
            "## Por que é explorável\n"
            "Materiais podem ser criados por staff OU pelo instrutor responsável do curso "
            "(conta `DOCTOR`) — não só por administradores. Um instrutor malicioso ou "
            "comprometido pode injetar um link que executa script na sessão de outro médico "
            "que clicar.\n\n"
            "## Evidência\n"
            "`frontend/src/routes/_medico.medico.cursos.$id.tsx:157` (mesmo padrão em "
            "`_app.gestao-cursos.$id.tsx:205` e `_medico.medico.blog.$id.tsx:92`)\n"
            "```tsx\n"
            '<a href={m.url} target=\"_blank\" rel=\"noreferrer\">{m.title}</a>\n'
            "```\n\n"
            "## Impacto\n"
            "XSS armazenado, executando na sessão autenticada de quem clicar no link.\n\n"
            "## Sugestão de correção\n"
            "Validar com allowlist de protocolo (`http:`/`https:`) em vez de `z.string().url()` "
            "puro, nos dois schemas (curso e material de artigo).\n\n"
            "## Critérios de aceite\n"
            "- [ ] Tentar salvar uma URL `javascript:` retorna erro de validação\n"
            "- [ ] Apenas `http://` e `https://` são aceitos nos dois formulários de material\n"
            "- [ ] Teste automatizado cobre a rejeição do esquema `javascript:`"
        ),
    },
    {
        "title": "[Segurança] Variáveis interpoladas sem escape no HTML dos e-mails transacionais",
        "labels": "security, medium",
        "body": (
            "## Problema\n"
            "`backend/src/lib/email/templates.ts` interpola `${data.name}` e `${data.reason}` "
            "direto em strings HTML, sem nenhuma função de escape ou lib de sanitização "
            "(nenhuma está instalada no projeto).\n\n"
            "## Por que é explorável\n"
            "`name` vem do cadastro do usuário (sem restrição de caracteres); `reason` é digitado "
            "por um MANAGER/ADMIN ao rejeitar um médico e chega no e-mail do médico rejeitado — "
            "um caso claro de injeção cruzada entre usuários, além de possibilitar phishing via "
            "HTML/CSS mesmo sem execução de script.\n\n"
            "## Evidência\n"
            "`backend/src/lib/email/templates.ts` (confirmCodeTemplate, resetPasswordTemplate, "
            "doctorPendingApprovalTemplate, doctorApprovedTemplate, doctorRejectedTemplate)\n"
            "```ts\n"
            "<h1>Bem-vindo, ${data.name}!</h1>\n"
            '${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : \"\"}\n'
            "```\n\n"
            "## Impacto\n"
            "Injeção de HTML nos e-mails enviados pelo sistema — risco de phishing e quebra de "
            "layout; execução de script se o cliente de e-mail do destinatário não bloquear "
            "`<script>`.\n\n"
            "## Sugestão de correção\n"
            "Escapar todo dado dinâmico (`<`, `>`, `&`, `\"`, `'`) antes de interpolar nas "
            "templates, ou usar uma lib de escape/sanitização dedicada.\n\n"
            "## Critérios de aceite\n"
            "- [ ] Nome/motivo contendo `<`, `>`, `\"` aparece como texto literal no e-mail, não "
            "como HTML\n"
            "- [ ] Cobertura aplicada a todas as 5 templates que interpolam dado de usuário"
        ),
    },
    {
        "title": "[Segurança] Endurecimentos menores: validação de avatar e algoritmo do JWT",
        "labels": "security, low",
        "body": (
            "## Problema\n"
            "Dois ajustes de dureza defensiva, sem exploração prática confirmada hoje:\n\n"
            "1. **Upload de avatar confia no Content-Type declarado pelo cliente**, não no "
            "conteúdo real do arquivo (`backend/src/modules/users/users.controller.ts:15-32`).\n"
            "2. **`jwt.verify()` não fixa `algorithms`** explicitamente "
            "(`backend/src/lib/jwt.ts:26-28`) — não explorável hoje pois o projeto não usa "
            "chaves assimétricas, mas é boa prática travar o algoritmo esperado.\n\n"
            "## Impacto\n"
            "Baixo no estado atual (avatar sempre renderizado via `<img>`, nunca como HTML; sem "
            "chave RSA em uso) — ambos são endurecimentos preventivos.\n\n"
            "## Sugestão de correção\n"
            "1. Verificar magic bytes do buffer recebido, não só `mimetype` declarado.\n"
            "2. Passar `{ algorithms: [\"HS256\"] }` em `jwt.verify()`.\n\n"
            "## Critérios de aceite\n"
            "- [ ] Upload com Content-Type falso mas conteúdo incompatível é rejeitado\n"
            "- [ ] `jwt.verify` só aceita tokens assinados com HS256"
        ),
    },
]

SCOPE_NOTE = (
    "Stack detectada: backend Node.js + Fastify 5 + Prisma 6 (PostgreSQL/Supabase) com "
    "autenticação JWT própria (jsonwebtoken + argon2), validação via zod; frontend React + "
    "TanStack Start; deploy Vercel (backend como função serverless, frontend com preset "
    "\"vercel\" do Nitro), sem Docker/CI/Terraform no repositório.\n\n"
    "Mapeamento das categorias para esta stack: (1) isolamento de posse — não há RLS ativo no "
    "caminho da aplicação (Prisma conecta com a role privilegiada do Postgres, que ignora "
    "RLS); o mecanismo real é filtragem manual por assignedSalesRepId/userId em cada serviço, "
    "auditado handler por handler. (2) permissão no navegador — cada rota sensível foi "
    "cruzada com seu requireRole no backend. (3) IDOR — todos os 10 módulos de rotas do "
    "backend foram lidos por completo, não por amostragem. (4) chaves expostas — varredura no "
    "código-fonte, .env.example, seed e histórico completo do git. (5) XSS — varredura em "
    "dangerouslySetInnerHTML/innerHTML/href/src no frontend e nas templates de e-mail HTML do "
    "backend."
)

# ---------------------------------------------------------------------------
# Gráficos
# ---------------------------------------------------------------------------
def make_donut_chart(path):
    order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    counts = {s: 0 for s in order}
    for f in FINDINGS:
        counts[f["sev"]] += 1
    labels = [s for s in order if counts[s] > 0]
    sizes = [counts[s] for s in order if counts[s] > 0]
    cols = [SEV_COLORS[s] for s in labels]

    fig, ax = plt.subplots(figsize=(4.6, 4.2), dpi=200)
    wedges, _ = ax.pie(
        sizes, colors=cols, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
    )
    ax.set_aspect("equal")
    total = sum(sizes)
    ax.text(0, 0.08, str(total), ha="center", va="center", fontsize=26, fontweight="bold", color="#111827")
    ax.text(0, -0.18, "achados", ha="center", va="center", fontsize=11, color="#6B7280")

    legend_labels = [f"{s} ({counts[s]})" for s in labels]
    ax.legend(
        wedges, legend_labels, loc="center left", bbox_to_anchor=(1.02, 0.5),
        frameon=False, fontsize=10.5,
    )
    fig.tight_layout()
    fig.savefig(path, transparent=True, bbox_inches="tight")
    plt.close(fig)


CATEGORY_SHORT = {
    "Chaves/Credenciais expostas": "Credenciais",
    "Autenticação / Rate limiting": "Rate limiting",
    "Autenticação / IDOR-like": "OTP/IDOR-like",
    "Inputs sem tratamento (XSS)": "XSS",
    "Inputs sem tratamento / Upload": "Upload",
    "Autenticação / Hardening": "JWT hardening",
}

def make_bar_chart(path):
    cat_order = []
    cat_counts = {}
    for f in FINDINGS:
        c = f["categoria"]
        if c not in cat_counts:
            cat_counts[c] = 0
            cat_order.append(c)
        cat_counts[c] += 1

    labels = cat_order
    values = [cat_counts[c] for c in labels]
    short_labels = [CATEGORY_SHORT.get(l, l) for l in labels]

    fig, ax = plt.subplots(figsize=(7.4, 4.4), dpi=200)
    bars = ax.bar(range(len(values)), values, width=0.58)
    for i, b in enumerate(bars):
        # colore por severidade mais alta daquela categoria
        sevs = [f["sev"] for f in FINDINGS if f["categoria"] == labels[i]]
        order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
        worst = min(sevs, key=lambda s: order.index(s))
        b.set_color(SEV_COLORS[worst])
        ax.text(b.get_x() + b.get_width() / 2, b.get_height() + 0.06, str(values[i]),
                ha="center", va="bottom", fontsize=10, color="#111827", fontweight="bold")

    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(short_labels, fontsize=9, color="#374151", rotation=28, ha="right")
    ax.set_ylim(0, max(values) + 1)
    ax.set_yticks(range(0, max(values) + 2))
    ax.tick_params(axis="y", labelsize=9, colors="#6B7280")
    for spine in ["top", "right", "left"]:
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color("#D1D5DB")
    ax.yaxis.grid(True, color="#E5E7EB", linewidth=0.8)
    ax.set_axisbelow(True)
    fig.tight_layout()
    fig.savefig(path, transparent=True, bbox_inches="tight")
    plt.close(fig)


donut_path = os.path.join(HERE, "_chart_donut.png")
bar_path = os.path.join(HERE, "_chart_bar.png")
make_donut_chart(donut_path)
make_bar_chart(bar_path)

# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
styles = getSampleStyleSheet()
styles.add(ParagraphStyle("CoverTitle", fontName="Helvetica-Bold", fontSize=26, leading=31, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle("CoverSub", fontName="Helvetica", fontSize=12.5, leading=18, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle("CoverMeta", fontName="Helvetica", fontSize=10, leading=15, textColor=MUTED))
styles.add(ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=INK, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=INK, spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle("Body", fontName="Helvetica", fontSize=9.6, leading=14, textColor=INK))
styles.add(ParagraphStyle("BodyMuted", fontName="Helvetica", fontSize=9.2, leading=13.5, textColor=MUTED))
styles.add(ParagraphStyle("Small", fontName="Helvetica", fontSize=8.3, leading=12, textColor=MUTED))
styles.add(ParagraphStyle("Mono", fontName="Courier", fontSize=7.8, leading=11.2, textColor=INK, backColor=BG_SOFT))
styles.add(ParagraphStyle("FindingTitle", fontName="Helvetica-Bold", fontSize=11, leading=14.5, textColor=INK, spaceBefore=2, spaceAfter=3))
styles.add(ParagraphStyle("FindingMeta", fontName="Helvetica-Oblique", fontSize=8.6, leading=12, textColor=MUTED, spaceAfter=6))
styles.add(ParagraphStyle("IssueTitle", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=INK, spaceBefore=10, spaceAfter=4))
styles.add(ParagraphStyle("StrengthTitle", fontName="Helvetica-Bold", fontSize=9.6, leading=13, textColor=hexcol(SEV_COLORS["Ponto forte"])))

def sev_chip(sev):
    c = SEV_COLORS.get(sev, "#6B7280")
    return Table(
        [[Paragraph(f'<font color="white"><b>{sev.upper()}</b></font>', ParagraphStyle("chip", fontName="Helvetica-Bold", fontSize=7.6, textColor=colors.white, alignment=TA_CENTER))]],
        colWidths=[2.35 * cm], rowHeights=[0.48 * cm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), hexcol(c)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ]),
    )

# ---------------------------------------------------------------------------
# Documento com cabeçalho/rodapé
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

def header_footer(canvas_obj: pdfcanvas.Canvas, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.drawString(MARGIN, PAGE_H - 1.25 * cm, "Relatório de Auditoria de Segurança — America Anatomy Institute")
    canvas_obj.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.25 * cm, "31 de agosto de 2026")
    canvas_obj.setStrokeColor(LINE)
    canvas_obj.line(MARGIN, PAGE_H - 1.4 * cm, PAGE_W - MARGIN, PAGE_H - 1.4 * cm)

    canvas_obj.line(MARGIN, 1.4 * cm, PAGE_W - MARGIN, 1.4 * cm)
    canvas_obj.drawString(MARGIN, 1.05 * cm, "Confidencial — uso interno")
    canvas_obj.drawRightString(PAGE_W - MARGIN, 1.05 * cm, f"Página {doc.page}")
    canvas_obj.restoreState()

def cover_page(canvas_obj: pdfcanvas.Canvas, doc):
    canvas_obj.saveState()
    canvas_obj.setFillColor(INK)
    canvas_obj.rect(0, PAGE_H - 6.2 * cm, PAGE_W, 6.2 * cm, fill=1, stroke=0)
    canvas_obj.restoreState()

doc = BaseDocTemplate(
    OUT_PDF, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.9 * cm, bottomMargin=1.9 * cm,
    title="Relatório de Auditoria de Segurança — America Anatomy Institute",
)
frame_normal = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN - 0.6 * cm, id="normal")
frame_cover = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN, id="cover")
doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[frame_cover], onPage=cover_page),
    PageTemplate(id="Normal", frames=[frame_normal], onPage=header_footer),
])

story = []

# --- CAPA ---
story.append(Spacer(1, 1.2 * cm))
story.append(Paragraph('<font color="white" size="12">AMERICA ANATOMY INSTITUTE</font>', ParagraphStyle("coverbrand", fontName="Helvetica-Bold")))
story.append(Spacer(1, 5.4 * cm))
story.append(Paragraph("Relatório de Auditoria de Segurança", styles["CoverTitle"]))
story.append(Paragraph("Revisão de código em busca de cinco categorias de falhas de segurança", styles["CoverSub"]))
story.append(Spacer(1, 0.6 * cm))
story.append(Paragraph("<b>Data:</b> 31 de agosto de 2026", styles["CoverMeta"]))
story.append(Paragraph("<b>Escopo:</b> backend Fastify/Prisma, frontend TanStack Start, configuração de deploy (Vercel)", styles["CoverMeta"]))
story.append(Paragraph("<b>Repositório:</b> Fontthini/america-anatomy", styles["CoverMeta"]))
story.append(Spacer(1, 0.7 * cm))
story.append(HRFlowable(width="100%", color=LINE, thickness=0.8))
story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph("<b>Nota metodológica</b>", styles["H2"]))
story.append(Paragraph(SCOPE_NOTE, styles["BodyMuted"]))

# a partir da próxima página, usa o template "Normal" (com cabeçalho/rodapé)
from reportlab.platypus import NextPageTemplate
story.append(NextPageTemplate("Normal"))
story.append(PageBreak())

# --- RESUMO EXECUTIVO ---
story.append(Paragraph("Resumo executivo", styles["H1"]))

order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
counts = {s: 0 for s in order}
for f in FINDINGS:
    counts[f["sev"]] += 1
summary_cells = []
for s in order:
    if counts[s] == 0:
        continue
    summary_cells.append(Paragraph(f'<font color="{SEV_COLORS[s]}"><b>{counts[s]}</b></font> {s}', styles["Body"]))
story.append(Table([summary_cells], colWidths=[(PAGE_W - 2 * MARGIN) / len(summary_cells)] * len(summary_cells)))
story.append(Spacer(1, 0.3 * cm))

charts_table = Table(
    [[Image(donut_path, width=7.2 * cm, height=6.5 * cm), Image(bar_path, width=8.6 * cm, height=5.1 * cm)]],
    colWidths=[7.4 * cm, 8.8 * cm],
)
charts_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
story.append(charts_table)
story.append(Spacer(1, 0.4 * cm))

story.append(Paragraph(
    f"Total de {len(FINDINGS)} achados verificados no código real (nenhuma especulação), além de "
    f"{len(STRENGTHS)} pontos fortes confirmados que já protegem o sistema hoje. O achado mais "
    "urgente (F1) é imediatamente acionável: credenciais de demonstração com papel ADMIN estão "
    "ativas no mesmo banco agora atrás do deploy de produção.",
    styles["Body"],
))

story.append(PageBreak())

# --- PONTOS FORTES ---
story.append(Paragraph("Pontos fortes verificados", styles["H1"]))
story.append(Paragraph(
    "O que já está protegido corretamente, com evidência no código — prova da cobertura desta auditoria.",
    styles["BodyMuted"],
))
story.append(Spacer(1, 0.2 * cm))
for title, loc, desc in STRENGTHS:
    row = Table(
        [[Paragraph(f"✓ {esc(title)}", styles["StrengthTitle"]), Paragraph(esc(loc), styles["Small"])],
         [Paragraph(esc(desc), styles["Body"]), ""]],
        colWidths=[(PAGE_W - 2 * MARGIN) * 0.72, (PAGE_W - 2 * MARGIN) * 0.28],
        style=TableStyle([
            ("SPAN", (0, 1), (1, 1)),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
            ("LINEBELOW", (0, 1), (-1, 1), 0.6, LINE),
        ]),
    )
    story.append(KeepTogether(row))

story.append(PageBreak())

# --- PONTOS FRACOS / ACHADOS DETALHADOS ---
story.append(Paragraph("Pontos fracos e achados detalhados", styles["H1"]))
story.append(Paragraph("Cada achado foi verificado diretamente no código, com arquivo e linha exatos.", styles["BodyMuted"]))
story.append(Spacer(1, 0.2 * cm))

for f in FINDINGS:
    block = []
    head = Table(
        [[sev_chip(f["sev"]), Paragraph(f'<b>{esc(f["id"])} · {esc(f["categoria"])}</b>', styles["Small"])]],
        colWidths=[2.6 * cm, (PAGE_W - 2 * MARGIN) - 2.6 * cm],
        style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]),
    )
    block.append(head)
    block.append(Spacer(1, 4))
    block.append(Paragraph(esc(f["titulo"]), styles["FindingTitle"]))
    block.append(Paragraph(esc(f["arquivo"]), styles["FindingMeta"]))
    block.append(Paragraph(esc(f["descricao"]), styles["Body"]))
    block.append(Spacer(1, 3))
    block.append(Paragraph(f'<b>Por que é explorável:</b> {esc(f["porque"])}', styles["Body"]))
    block.append(Spacer(1, 4))
    block.append(Paragraph(esc_br(f["codigo"]), styles["Mono"]))
    block.append(Spacer(1, 10))
    block.append(HRFlowable(width="100%", color=LINE, thickness=0.6))
    block.append(Spacer(1, 8))
    story.append(KeepTogether(block))

story.append(PageBreak())

# --- RECOMENDAÇÕES PRIORIZADAS ---
story.append(Paragraph("Recomendações priorizadas", styles["H1"]))
rec_data = [[Paragraph("<b>Prior.</b>", styles["Small"]), Paragraph("<b>Recomendação</b>", styles["Small"]), Paragraph("<b>Detalhe</b>", styles["Small"])]]
for p, title, detail in RECOMMENDATIONS:
    color = {"P1": SEV_COLORS["Crítica"], "P2": SEV_COLORS["Média"], "P3": SEV_COLORS["Baixa"]}[p]
    rec_data.append([
        Paragraph(f'<font color="{color}"><b>{p}</b></font>', styles["Body"]),
        Paragraph(esc(title), styles["Body"]),
        Paragraph(esc(detail), styles["Small"]),
    ])
rec_table = Table(rec_data, colWidths=[1.4 * cm, 6.4 * cm, (PAGE_W - 2 * MARGIN) - 1.4 * cm - 6.4 * cm])
rec_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BG_SOFT),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(rec_table)

story.append(PageBreak())

# --- ISSUES PARA O GITHUB ---
story.append(Paragraph("Issues para o GitHub", styles["H1"]))
story.append(Paragraph(
    "Texto completo em Markdown, pronto para copiar e colar na criação de cada issue.",
    styles["BodyMuted"],
))
story.append(Spacer(1, 0.2 * cm))

for i, issue in enumerate(GITHUB_ISSUES, start=1):
    story.append(Paragraph(f"--- ISSUE {i} ---", styles["Small"]))
    story.append(Paragraph(esc(issue["title"]), styles["IssueTitle"]))
    story.append(Paragraph(f'<b>Labels:</b> {esc(issue["labels"])}', styles["Small"]))
    story.append(Paragraph(esc_br(issue["body"]), styles["Mono"]))
    story.append(Paragraph(f"--- FIM ISSUE {i} ---", styles["Small"]))
    story.append(Spacer(1, 12))

doc.build(story)
print(f"PDF gerado em: {OUT_PDF}")
