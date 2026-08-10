/**
 * Funções de API de catálogo (produtos, cursos, seminários).
 * Contrato: backend/docs/api-contract.md — seção Catálogo (/api/catalog/)
 */

import { apiFetch } from "./client";

export type CatalogItemType = "PRODUCT" | "COURSE" | "SEMINAR";
export type CatalogItemStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CatalogItemResponse = {
  id: string;
  type: CatalogItemType;
  status: CatalogItemStatus;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  capacity: number | null;
  vagasRestantes: number | null;
  sku: string | null;
  stockQty: number | null;
  createdAt: string;
};

/** GET /api/catalog?type=&status= */
export async function apiListCatalogItems(filters?: {
  type?: CatalogItemType;
  status?: CatalogItemStatus;
}): Promise<CatalogItemResponse[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  return apiFetch<CatalogItemResponse[]>(`/api/catalog${qs ? `?${qs}` : ""}`);
}

/** GET /api/catalog/:id */
export async function apiGetCatalogItem(id: string): Promise<CatalogItemResponse> {
  return apiFetch<CatalogItemResponse>(`/api/catalog/${id}`);
}

export type CreateCatalogItemPayload =
  | {
      type: "PRODUCT";
      title: string;
      description?: string;
      imageUrl?: string;
      price?: number;
      sku?: string;
      stockQty?: number;
    }
  | {
      type: "COURSE" | "SEMINAR";
      title: string;
      description?: string;
      imageUrl?: string;
      price?: number;
      startsAt: string;
      endsAt?: string;
      location?: string;
      isOnline?: boolean;
      capacity?: number;
    };

/** POST /api/catalog — staff/admin */
export async function apiCreateCatalogItem(payload: CreateCatalogItemPayload): Promise<CatalogItemResponse> {
  return apiFetch<CatalogItemResponse>("/api/catalog", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/catalog/:id — staff/admin */
export async function apiUpdateCatalogItem(
  id: string,
  patch: Record<string, unknown>,
): Promise<CatalogItemResponse> {
  return apiFetch<CatalogItemResponse>(`/api/catalog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** PATCH /api/catalog/:id/archive — staff/admin */
export async function apiArchiveCatalogItem(id: string): Promise<CatalogItemResponse> {
  return apiFetch<CatalogItemResponse>(`/api/catalog/${id}/archive`, { method: "PATCH" });
}
