/**
 * Funções de API de autenticação.
 * Cada função reflete exatamente um endpoint do contrato:
 * backend/docs/api-contract.md
 */

import { apiFetch, setToken, clearToken } from "./client";
import type { MockUser } from "../mock/users";

type AuthResponse = {
  user: MockUser;
  token: string;
};

/** POST /api/auth/login — autentica e armazena o access token. */
export async function apiLogin(email: string, password: string): Promise<MockUser> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(data.token);
  return data.user;
}

/** POST /api/auth/register — cria conta e armazena o access token. */
export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<MockUser> {
  const data = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  setToken(data.token);
  return data.user;
}

/**
 * POST /api/auth/logout — invalida o refresh token no servidor e limpa o cookie.
 * O token local é sempre limpo, mesmo em caso de erro de rede.
 */
export async function apiLogout(): Promise<void> {
  try {
    await apiFetch<void>("/api/auth/logout", {
      method: "POST",
      skipAuth: true,
    });
  } finally {
    clearToken();
  }
}

/**
 * GET /api/auth/me — retorna o usuário autenticado.
 * O client.ts faz refresh automático se o access token estiver expirado.
 */
export async function apiMe(): Promise<MockUser> {
  return apiFetch<MockUser>("/api/auth/me");
}

/** POST /api/auth/confirm-email — confirma e-mail via código OTP de 6 dígitos. */
export async function apiConfirmEmail(email: string, code: string): Promise<void> {
  await apiFetch<{ message: string }>("/api/auth/confirm-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    skipAuth: true,
  });
}

/** POST /api/auth/resend-confirmation — reenvia e-mail de confirmação. */
export async function apiResendConfirmation(email: string): Promise<void> {
  await apiFetch<{ message: string }>("/api/auth/resend-confirmation", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

/** POST /api/auth/forgot-password — solicita redefinição de senha. Sempre retorna sucesso. */
export async function apiForgotPassword(email: string): Promise<void> {
  await apiFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

/** POST /api/auth/reset-password — redefine senha via token. Faz logout global. */
export async function apiResetPassword(token: string, password: string): Promise<void> {
  await apiFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
    skipAuth: true,
  });
}
