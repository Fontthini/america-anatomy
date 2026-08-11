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
  category: string | null;
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
      category?: string;
      sku?: string;
      stockQty?: number;
    }
  | {
      type: "COURSE" | "SEMINAR";
      title: string;
      description?: string;
      imageUrl?: string;
      price?: number;
      category?: string;
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

// ---------------------------------------------------------------------------
// Página pública do curso + inscrição de interesse (médico parceiro sem conta)
// ---------------------------------------------------------------------------

export type PublicCatalogItemResponse = {
  id: string;
  type: CatalogItemType;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  vagasRestantes: number | null;
};

export type CourseRegistrationStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "DECLINED";

export type CourseRegistrationResponse = {
  id: string;
  catalogItemId: string;
  name: string;
  email: string;
  crm: string | null;
  whatsapp: string;
  notes: string | null;
  status: CourseRegistrationStatus;
  createdAt: string;
};

export type EnrolledDoctorResponse = {
  orderId: string;
  doctorProfileId: string;
  name: string;
  email: string;
  crm: string | null;
  phone: string | null;
  createdAt: string;
};

/** GET /api/catalog/public/:slug — sem login */
export async function apiGetPublicCourse(slug: string): Promise<PublicCatalogItemResponse> {
  return apiFetch<PublicCatalogItemResponse>(`/api/catalog/public/${slug}`, { skipAuth: true });
}

/** POST /api/catalog/:id/register-interest — sem login */
export async function apiRegisterInterest(
  catalogItemId: string,
  payload: { name: string; email: string; crm?: string; whatsapp: string; notes?: string },
): Promise<CourseRegistrationResponse> {
  return apiFetch<CourseRegistrationResponse>(`/api/catalog/${catalogItemId}/register-interest`, {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

/** GET /api/catalog/:id/registrations — staff */
export async function apiListCourseRegistrations(catalogItemId: string): Promise<CourseRegistrationResponse[]> {
  return apiFetch<CourseRegistrationResponse[]>(`/api/catalog/${catalogItemId}/registrations`);
}

/** PATCH /api/catalog/:id/registrations/:regId — staff */
export async function apiUpdateRegistrationStatus(
  catalogItemId: string,
  registrationId: string,
  status: CourseRegistrationStatus,
): Promise<CourseRegistrationResponse> {
  return apiFetch<CourseRegistrationResponse>(`/api/catalog/${catalogItemId}/registrations/${registrationId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/** GET /api/catalog/:id/orders — staff, quem já tem conta e se inscreveu de verdade */
export async function apiListEnrolledDoctors(catalogItemId: string): Promise<EnrolledDoctorResponse[]> {
  return apiFetch<EnrolledDoctorResponse[]>(`/api/catalog/${catalogItemId}/orders`);
}

// ---------------------------------------------------------------------------
// Materiais do curso (vídeos/PDFs/links) — só pra quem se inscreveu, ou staff
// ---------------------------------------------------------------------------

export type CourseMaterialType = "VIDEO" | "PDF" | "LINK";

export type CourseMaterialResponse = {
  id: string;
  catalogItemId: string;
  title: string;
  type: CourseMaterialType;
  url: string;
  order: number;
  createdAt: string;
};

export type CourseMaterialPayload = {
  title: string;
  type: CourseMaterialType;
  url: string;
  order?: number;
};

/** GET /api/catalog/:id/materials — médico só se inscrito; staff sempre */
export async function apiListCourseMaterials(catalogItemId: string): Promise<CourseMaterialResponse[]> {
  return apiFetch<CourseMaterialResponse[]>(`/api/catalog/${catalogItemId}/materials`);
}

/** POST /api/catalog/:id/materials — staff/admin */
export async function apiCreateCourseMaterial(
  catalogItemId: string,
  payload: CourseMaterialPayload,
): Promise<CourseMaterialResponse> {
  return apiFetch<CourseMaterialResponse>(`/api/catalog/${catalogItemId}/materials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/catalog/:id/materials/:materialId — staff/admin */
export async function apiUpdateCourseMaterial(
  catalogItemId: string,
  materialId: string,
  patch: Partial<CourseMaterialPayload>,
): Promise<CourseMaterialResponse> {
  return apiFetch<CourseMaterialResponse>(`/api/catalog/${catalogItemId}/materials/${materialId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** DELETE /api/catalog/:id/materials/:materialId — staff/admin */
export async function apiDeleteCourseMaterial(catalogItemId: string, materialId: string): Promise<void> {
  await apiFetch<void>(`/api/catalog/${catalogItemId}/materials/${materialId}`, { method: "DELETE" });
}
