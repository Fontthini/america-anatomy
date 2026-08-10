/**
 * Funções de API de perfil do usuário.
 * Contrato: backend/docs/api-contract.md — seção Perfil (/api/users/)
 */

import { apiFetch, getToken, ApiError } from "./client";
import type { MockUser } from "../mock/users";

const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3001";

/**
 * PATCH /api/users/me — atualiza nome e bio do usuário autenticado.
 */
export async function apiUpdateProfile(payload: {
  name: string;
  bio?: string;
}): Promise<MockUser> {
  return apiFetch<MockUser>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/users/me/preferences — atualiza preferências de notificação.
 */
export async function apiUpdatePreferences(payload: {
  emailNotifications?: boolean;
  productUpdates?: boolean;
}): Promise<MockUser> {
  return apiFetch<MockUser>("/api/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/users/me/avatar — faz upload de avatar via multipart/form-data.
 * Usa fetch diretamente para não forçar Content-Type: application/json.
 */
export async function apiUploadAvatar(file: File): Promise<MockUser> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let message = "Falha ao fazer upload do avatar.";
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // ignora
    }
    throw new ApiError(code, message, res.status);
  }

  return res.json() as Promise<MockUser>;
}
