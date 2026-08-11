/**
 * Funções de API do Blog (artigos científicos).
 * Contrato: backend/docs/api-contract.md — seção Blog (/api/articles/)
 */

import { apiFetch } from "./client";

export type ArticleMaterial = { name: string; url: string };

export type ArticleResponse = {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  videoUrl: string | null;
  category: string | null;
  materials: ArticleMaterial[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
};

export type ArticlePayload = {
  title: string;
  content: string;
  coverImageUrl?: string;
  videoUrl?: string;
  category?: string;
  materials?: ArticleMaterial[];
  published?: boolean;
};

/** GET /api/articles?category= */
export async function apiListArticles(category?: string): Promise<ArticleResponse[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<ArticleResponse[]>(`/api/articles${qs}`);
}

/** GET /api/articles/:id */
export async function apiGetArticle(id: string): Promise<ArticleResponse> {
  return apiFetch<ArticleResponse>(`/api/articles/${id}`);
}

/** POST /api/articles — staff/admin */
export async function apiCreateArticle(payload: ArticlePayload): Promise<ArticleResponse> {
  return apiFetch<ArticleResponse>("/api/articles", { method: "POST", body: JSON.stringify(payload) });
}

/** PATCH /api/articles/:id — staff/admin */
export async function apiUpdateArticle(id: string, payload: Partial<ArticlePayload>): Promise<ArticleResponse> {
  return apiFetch<ArticleResponse>(`/api/articles/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

/** DELETE /api/articles/:id — staff/admin */
export async function apiDeleteArticle(id: string): Promise<void> {
  await apiFetch<void>(`/api/articles/${id}`, { method: "DELETE" });
}
