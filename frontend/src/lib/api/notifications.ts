/**
 * Funções de API de notificações.
 * Contrato: backend/docs/api-contract.md — seção Notificações (/api/notifications/)
 */

import { apiFetch } from "./client";

export type NotificationType =
  | "WELCOME"
  | "EMAIL_VERIFIED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PROFILE_UPDATED"
  | "AVATAR_UPDATED";

export type ApiNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

/** GET /api/notifications — retorna as últimas 100, mais recentes primeiro */
export async function apiGetNotifications(): Promise<ApiNotification[]> {
  return apiFetch<ApiNotification[]>("/api/notifications");
}

/** PATCH /api/notifications/:id/read — marca uma notificação como lida */
export async function apiMarkRead(id: string): Promise<void> {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

/** PATCH /api/notifications/read-all — marca todas como lidas */
export async function apiMarkAllRead(): Promise<void> {
  return apiFetch<void>("/api/notifications/read-all", { method: "PATCH" });
}
