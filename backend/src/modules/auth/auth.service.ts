import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiresInMs,
} from "../../lib/jwt.js";
import { AppError } from "../../middlewares/error-handler.js";
import { generateToken, generateOtpCode, hashToken } from "../../lib/token.js";
import { sendEmail } from "../../lib/email/send.js";
import {
  confirmCodeTemplate,
  resetPasswordTemplate,
  buildResetUrl,
} from "../../lib/email/templates.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import type {
  RegisterInput,
  LoginInput,
  ConfirmEmailInput,
  ResendConfirmationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UserResponse,
  AuthResponse,
} from "./auth.schemas.js";
import { randomUUID } from "crypto";

const CONFIRM_EMAIL_TTL_MS = 15 * 60 * 1000;         // 15 min (OTP de curta duração)
const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000;        // 1h
const RESEND_COOLDOWN_MS = 60 * 1000;                // 1 min entre reenvios de OTP
const FORGOT_PASSWORD_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h entre solicitações de reset
const PASSWORD_HISTORY_LIMIT = 5;                    // quantas senhas anteriores bloquear

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  emailVerified: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    emailNotifications: user.emailNotifications,
    productUpdates: user.productUpdates,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    ...(user.bio ? { bio: user.bio } : {}),
  };
}

function issueTokens(user: { id: string; email: string }): {
  accessToken: string;
  refreshToken: string;
  jti: string;
} {
  const jti = randomUUID();
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  return { accessToken, refreshToken, jti };
}

async function persistRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + refreshTokenExpiresInMs());
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}

async function createVerificationToken(
  userId: string,
  type: "CONFIRM_EMAIL" | "RESET_PASSWORD",
  ttlMs: number,
): Promise<string> {
  // Invalida tokens anteriores do mesmo tipo para este usuário
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  // CONFIRM_EMAIL usa código OTP numérico de 6 dígitos;
  // RESET_PASSWORD usa token aleatório longo para links de e-mail.
  const { raw, hash } = type === "CONFIRM_EMAIL" ? generateOtpCode() : generateToken();
  const expiresAt = new Date(Date.now() + ttlMs);
  await prisma.verificationToken.create({
    data: { userId, tokenHash: hash, type, expiresAt },
  });
  return raw;
}

// ---------------------------------------------------------------------------
// Auth principal
// ---------------------------------------------------------------------------

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Este e-mail já está em uso.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      passwordHistory: { create: { passwordHash } },
    },
  });

  // Envia e-mail de boas-vindas com código OTP de 6 dígitos (best-effort)
  const otp = await createVerificationToken(user.id, "CONFIRM_EMAIL", CONFIRM_EMAIL_TTL_MS);
  const tpl = confirmCodeTemplate({ name: user.name, code: otp });
  void sendEmail({ to: user.email, ...tpl });

  const { accessToken, refreshToken } = issueTokens(user);
  await persistRefreshToken(user.id, refreshToken);

  void createNotification(user.id, NotificationType.WELCOME);

  return { user: toUserResponse(user), token: accessToken, refreshToken };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    const details = user.passwordChangedAt
      ? { passwordChangedAt: user.passwordChangedAt.toISOString() }
      : undefined;
    throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.", details);
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await persistRefreshToken(user.id, refreshToken);

  return { user: toUserResponse(user), token: accessToken, refreshToken };
}

export async function refreshUserToken(
  refreshToken: string,
): Promise<{ token: string; newRefreshToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "TOKEN_EXPIRED", "Refresh token inválido ou expirado.");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
    throw new AppError(401, "TOKEN_EXPIRED", "Refresh token inválido ou expirado.");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Usuário não encontrado.");
  }

  const { accessToken, refreshToken: newRefreshToken } = issueTokens(user);
  await persistRefreshToken(user.id, newRefreshToken);

  return { token: accessToken, newRefreshToken };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function getMe(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Usuário não encontrado.");
  }
  return toUserResponse(user);
}

// ---------------------------------------------------------------------------
// Confirmação de e-mail
// ---------------------------------------------------------------------------

export async function confirmEmail(input: ConfirmEmailInput): Promise<void> {
  const tokenHash = hashToken(input.code);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== "CONFIRM_EMAIL") {
    throw new AppError(400, "INVALID_CODE", "Código de verificação inválido.");
  }
  if (record.usedAt) {
    throw new AppError(400, "CODE_ALREADY_USED", "Este código já foi utilizado.");
  }
  if (record.expiresAt < new Date()) {
    throw new AppError(400, "CODE_EXPIRED", "Código de verificação expirado. Solicite um novo.");
  }

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    }),
  ]);

  void createNotification(record.userId, NotificationType.EMAIL_VERIFIED);
}

export async function resendConfirmation(input: ResendConfirmationInput): Promise<void> {
  // Resposta genérica independente de existir ou não o e-mail
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.emailVerified) return;

  // Rate limit: não reenviar se já existe token não-utilizado criado há menos de 1 min
  const recent = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "CONFIRM_EMAIL",
      usedAt: null,
      createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
  });
  if (recent) return;

  const otp = await createVerificationToken(user.id, "CONFIRM_EMAIL", CONFIRM_EMAIL_TTL_MS);
  const tpl = confirmCodeTemplate({ name: user.name, code: otp });
  void sendEmail({ to: user.email, ...tpl });
}

// ---------------------------------------------------------------------------
// Recuperação de senha
// ---------------------------------------------------------------------------

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  // Sempre retorna sucesso para não revelar se o e-mail existe
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return;

  // Rate limit: bloqueia nova solicitação se já existe um link ativo (não usado) nos últimos 24h
  const recentUnusedRequest = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "RESET_PASSWORD",
      usedAt: null,
      createdAt: { gte: new Date(Date.now() - FORGOT_PASSWORD_COOLDOWN_MS) },
    },
  });
  if (recentUnusedRequest) return;

  const rawToken = await createVerificationToken(user.id, "RESET_PASSWORD", RESET_PASSWORD_TTL_MS);
  const tpl = resetPasswordTemplate({ name: user.name, resetUrl: buildResetUrl(rawToken) });
  void sendEmail({ to: user.email, ...tpl });
  void createNotification(user.id, NotificationType.PASSWORD_RESET_REQUESTED);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashToken(input.token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== "RESET_PASSWORD") {
    throw new AppError(400, "INVALID_TOKEN", "Link de redefinição inválido.");
  }
  if (record.usedAt) {
    throw new AppError(400, "TOKEN_ALREADY_USED", "Este link já foi utilizado.");
  }
  if (record.expiresAt < new Date()) {
    throw new AppError(400, "TOKEN_EXPIRED", "Link de redefinição expirado.");
  }

  // Verifica se a nova senha já foi usada recentemente (últimas N + senha atual)
  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    include: {
      passwordHistory: {
        orderBy: { createdAt: "desc" },
        take: PASSWORD_HISTORY_LIMIT,
      },
    },
  });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Usuário não encontrado.");
  }

  // Checa senha atual + histórico recente
  const hashesToCheck = [user.passwordHash, ...user.passwordHistory.map((h) => h.passwordHash)];
  for (const oldHash of hashesToCheck) {
    const isReused = await verifyPassword(oldHash, input.password);
    if (isReused) {
      throw new AppError(
        400,
        "PASSWORD_ALREADY_USED",
        "Você já usou essa senha recentemente. Escolha uma diferente.",
      );
    }
  }

  const newPasswordHash = await hashPassword(input.password);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Marca token como usado
    await tx.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    // Salva hash atual no histórico antes de sobrescrever
    await tx.passwordHistory.create({
      data: { userId: user.id, passwordHash: user.passwordHash },
    });

    // Remove entradas antigas além do limite (mantém apenas as N mais recentes)
    const oldEntries = await tx.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: PASSWORD_HISTORY_LIMIT,
      select: { id: true },
    });
    if (oldEntries.length > 0) {
      await tx.passwordHistory.deleteMany({
        where: { id: { in: oldEntries.map((e) => e.id) } },
      });
    }

    // Atualiza senha e registra data da troca
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash, passwordChangedAt: now },
    });

    // Logout global: invalida todos os refresh tokens ativos
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
  });

  void createNotification(user.id, NotificationType.PASSWORD_CHANGED);
}
