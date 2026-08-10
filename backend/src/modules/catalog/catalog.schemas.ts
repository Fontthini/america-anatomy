import { z } from "zod";
import type { CatalogItemType, CatalogItemStatus } from "@prisma/client";

const baseFields = {
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres.").max(150),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url("URL de imagem inválida.").optional(),
  price: z.number().nonnegative().optional(),
};

const eventFields = {
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  isOnline: z.boolean().default(false),
  capacity: z.number().int().positive().optional(),
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
  imageUrl: z.string().url().optional(),
  price: z.number().nonnegative().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  isOnline: z.boolean().optional(),
  capacity: z.number().int().positive().optional(),
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
