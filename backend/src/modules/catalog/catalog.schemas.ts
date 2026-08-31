import { z } from "zod";
import type { CatalogItemType, CatalogItemStatus, CourseRegistrationStatus } from "@prisma/client";

// z.string().url() aceita qualquer esquema válido de URI, incluindo
// "javascript:alert(1)" — que, renderizado como href/src no frontend, executa
// script arbitrário (XSS). Restringe a http/https, os únicos esquemas usados
// de fato por imagens e links de material.
const httpUrl = (message: string) =>
  z
    .string()
    .url(message)
    .refine((v) => /^https?:\/\//i.test(v), { message: "URL deve começar com http:// ou https://." });

const baseFields = {
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres.").max(150),
  description: z.string().max(2000).optional(),
  imageUrl: httpUrl("URL de imagem inválida.").optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().max(60).optional(),
};

const eventFields = {
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  isOnline: z.boolean().default(false),
  capacity: z.number().int().positive().optional(),
  instructorUserId: z.string().optional(),
};

export const createCatalogItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PRODUCT"),
    ...baseFields,
    sku: z.string().max(50).optional(),
    stockQty: z.number().int().nonnegative().optional(),
  }),
  z.object({ type: z.literal("COURSE"), ...baseFields, ...eventFields }),
  z.object({ type: z.literal("SEMINAR"), ...baseFields, ...eventFields }),
]);

export const updateCatalogItemSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: httpUrl("URL de imagem inválida.").optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().max(60).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  isOnline: z.boolean().optional(),
  capacity: z.number().int().positive().optional(),
  instructorUserId: z.string().nullable().optional(),
  sku: z.string().max(50).optional(),
  stockQty: z.number().int().nonnegative().optional(),
});

export const listCatalogItemsQuerySchema = z.object({
  type: z.enum(["PRODUCT", "COURSE", "SEMINAR"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type CreateCatalogItemInput = z.infer<typeof createCatalogItemSchema>;
export type UpdateCatalogItemInput = z.infer<typeof updateCatalogItemSchema>;
export type ListCatalogItemsQuery = z.infer<typeof listCatalogItemsQuerySchema>;

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
  instructorUserId: string | null;
  instructorName: string | null;
  sku: string | null;
  stockQty: number | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Inscrição pública em curso/seminário (médico parceiro sem conta)
// ---------------------------------------------------------------------------

export const registerInterestSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(150),
  email: z.string().email("E-mail inválido."),
  crm: z.string().min(2, "Informe seu CRM ou outro registro profissional.").max(30),
  whatsapp: z.string().min(8, "WhatsApp inválido.").max(30),
  notes: z.string().max(500).optional(),
});

export const updateRegistrationStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONFIRMED", "DECLINED"]),
});

export type RegisterInterestInput = z.infer<typeof registerInterestSchema>;
export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>;

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

/** Subconjunto seguro pra página pública — não exige auth, não expõe estoque/vagas de outros itens. */
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

/** Item do roster de um curso/seminário — quem já tem conta e se inscreveu de verdade (Order). */
export type EnrolledDoctorResponse = {
  orderId: string;
  doctorProfileId: string;
  name: string;
  email: string;
  crm: string | null;
  phone: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Materiais do curso (vídeos/PDFs/links) — liberados só pra quem se inscreveu
// ---------------------------------------------------------------------------

export const createCourseMaterialSchema = z.object({
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres.").max(150),
  type: z.enum(["VIDEO", "PDF", "LINK"]),
  url: httpUrl("URL inválida."),
  order: z.number().int().default(0),
});

export const updateCourseMaterialSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  type: z.enum(["VIDEO", "PDF", "LINK"]).optional(),
  url: httpUrl("URL inválida.").optional(),
  order: z.number().int().optional(),
});

export type CreateCourseMaterialInput = z.infer<typeof createCourseMaterialSchema>;
export type UpdateCourseMaterialInput = z.infer<typeof updateCourseMaterialSchema>;

export type CourseMaterialResponse = {
  id: string;
  catalogItemId: string;
  title: string;
  type: "VIDEO" | "PDF" | "LINK";
  url: string;
  order: number;
  createdAt: string;
};
