/**
 * Funções de API de banners (Loja e Blog).
 * Contrato: backend/docs/api-contract.md — seção Banners (/api/banners/)
 */

import { apiFetch } from "./client";

export type BannerPlacement = "LOJA" | "BLOG";

export type BannerResponse = {
  id: string;
  placement: BannerPlacement;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  active: boolean;
  order: number;
  createdAt: string;
};

export type BannerPayload = {
  placement: BannerPlacement;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  active?: boolean;
  order?: number;
};

/** GET /api/banners?placement= */
export async function apiListBanners(placement?: BannerPlacement): Promise<BannerResponse[]> {
  const qs = placement ? `?placement=${placement}` : "";
  return apiFetch<BannerResponse[]>(`/api/banners${qs}`);
}

/** POST /api/banners — staff/admin */
export async function apiCreateBanner(payload: BannerPayload): Promise<BannerResponse> {
  return apiFetch<BannerResponse>("/api/banners", { method: "POST", body: JSON.stringify(payload) });
}

/** PATCH /api/banners/:id — staff/admin */
export async function apiUpdateBanner(id: string, patch: Partial<BannerPayload>): Promise<BannerResponse> {
  return apiFetch<BannerResponse>(`/api/banners/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** DELETE /api/banners/:id — staff/admin */
export async function apiDeleteBanner(id: string): Promise<void> {
  await apiFetch<void>(`/api/banners/${id}`, { method: "DELETE" });
}
