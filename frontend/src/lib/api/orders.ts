/**
 * Funções de API de pedidos (compra de produto ou inscrição em curso/seminário).
 * Contrato: backend/docs/api-contract.md — seção Pedidos (/api/orders/)
 */

import { apiFetch } from "./client";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type OrderResponse = {
  id: string;
  catalogItemId: string;
  catalogItemTitle: string;
  catalogItemType: string;
  quantity: number;
  status: OrderStatus;
  unitPrice: string | null;
  createdAt: string;
};

/** POST /api/orders */
export async function apiCreateOrder(catalogItemId: string, quantity = 1): Promise<OrderResponse> {
  return apiFetch<OrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ catalogItemId, quantity }),
  });
}

/** GET /api/orders/me */
export async function apiListMyOrders(): Promise<OrderResponse[]> {
  return apiFetch<OrderResponse[]>("/api/orders/me");
}
