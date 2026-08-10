import type { FastifyRequest, FastifyReply } from "fastify";
import {
  registerSchema,
  loginSchema,
  confirmEmailSchema,
  resendConfirmationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";
import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getMe,
  confirmEmail,
  resendConfirmation,
  forgotPassword,
  resetPassword,
} from "./auth.service.js";
import { env } from "../../config/env.js";
import { refreshTokenTtlSeconds } from "../../lib/jwt.js";

const REFRESH_COOKIE = "bp.refresh";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: refreshTokenTtlSeconds(),
};

export async function handleRegister(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  reply
    .setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)
    .status(201)
    .send({ user: result.user, token: result.token });
}

export async function handleLogin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  reply
    .setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)
    .status(200)
    .send({ user: result.user, token: result.token });
}

export async function handleRefresh(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const refreshToken = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
  if (!refreshToken) {
    return reply
      .status(401)
      .send({ error: { code: "UNAUTHORIZED", message: "Refresh token ausente." } });
  }

  const { token, newRefreshToken } = await refreshUserToken(refreshToken);
  reply.setCookie(REFRESH_COOKIE, newRefreshToken, cookieOptions).status(200).send({ token });
}

export async function handleLogout(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const refreshToken = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
  if (refreshToken) {
    await logoutUser(refreshToken);
  }
  reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" }).status(204).send();
}

export async function handleMe(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await getMe(req.user.id);
  reply.status(200).send(user);
}

export async function handleConfirmEmail(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = confirmEmailSchema.parse(req.body);
  await confirmEmail(input);
  reply.status(200).send({ message: "E-mail confirmado com sucesso." });
}

export async function handleResendConfirmation(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = resendConfirmationSchema.parse(req.body);
  await resendConfirmation(input);
  // Resposta genérica (não revela se o e-mail existe ou não)
  reply.status(200).send({ message: "Se o e-mail existir e não estiver confirmado, um novo link foi enviado." });
}

export async function handleForgotPassword(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = forgotPasswordSchema.parse(req.body);
  await forgotPassword(input);
  // Resposta genérica (não revela se o e-mail existe ou não)
  reply.status(200).send({ message: "Se o e-mail existir, um link de redefinição foi enviado." });
}

export async function handleResetPassword(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input);
  reply.status(200).send({ message: "Senha redefinida com sucesso. Faça login com a nova senha." });
}
