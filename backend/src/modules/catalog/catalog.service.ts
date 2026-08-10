import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import type {
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
  ListCatalogItemsQuery,
  CatalogItemResponse,
} from "./catalog.schemas.js";
import type { CatalogItem } from "@prisma/client";

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "item";
  let slug = base;
  let suffix = 1;
  while (await prisma.catalogItem.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

function toCatalogItemResponse(item: CatalogItem, confirmedOrders: number): CatalogItemResponse {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    slug: item.slug,
    description: item.description,
    imageUrl: item.imageUrl,
    price: item.price ? item.price.toString() : null,
    startsAt: item.startsAt ? item.startsAt.toISOString() : null,
    endsAt: item.endsAt ? item.endsAt.toISOString() : null,
    location: item.location,
    isOnline: item.isOnline,
    capacity: item.capacity,
    vagasRestantes: item.capacity !== null ? Math.max(item.capacity - confirmedOrders, 0) : null,
    sku: item.sku,
    stockQty: item.stockQty,
    createdAt: item.createdAt.toISOString(),
  };
}

async function countConfirmedOrdersByItem(itemIds: string[]): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();
  const groups = await prisma.order.groupBy({
    by: ["catalogItemId"],
    where: { catalogItemId: { in: itemIds }, status: "CONFIRMED" },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.catalogItemId, g._count._all]));
}

/** doctors só enxergam PUBLISHED, independentemente do filtro solicitado; staff/admin enxergam qualquer status. */
export async function listCatalogItems(
  query: ListCatalogItemsQuery,
  isStaffOrAdmin: boolean,
): Promise<CatalogItemResponse[]> {
  const where = {
    ...(query.type ? { type: query.type } : {}),
    status: isStaffOrAdmin ? query.status : "PUBLISHED",
  };
  const items = await prisma.catalogItem.findMany({ where, orderBy: { createdAt: "desc" } });
  const counts = await countConfirmedOrdersByItem(items.map((i) => i.id));
  return items.map((item) => toCatalogItemResponse(item, counts.get(item.id) ?? 0));
}

export async function getCatalogItemById(
  id: string,
  isStaffOrAdmin: boolean,
): Promise<CatalogItemResponse> {
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item || (!isStaffOrAdmin && item.status !== "PUBLISHED")) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de catálogo não encontrado.");
  }
  const counts = await countConfirmedOrdersByItem([item.id]);
  return toCatalogItemResponse(item, counts.get(item.id) ?? 0);
}

export async function createCatalogItem(input: CreateCatalogItemInput): Promise<CatalogItemResponse> {
  const slug = await generateUniqueSlug(input.title);
  const item = await prisma.catalogItem.create({
    data: {
      type: input.type,
      title: input.title,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      price: input.price,
      ...(input.type === "PRODUCT"
        ? { sku: input.sku, stockQty: input.stockQty }
        : {
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            location: input.location,
            isOnline: input.isOnline,
            capacity: input.capacity,
          }),
    },
  });
  return toCatalogItemResponse(item, 0);
}

export async function updateCatalogItem(
  id: string,
  input: UpdateCatalogItemInput,
): Promise<CatalogItemResponse> {
  const existing = await prisma.catalogItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de catálogo não encontrado.");
  }
  const item = await prisma.catalogItem.update({ where: { id }, data: input });
  const counts = await countConfirmedOrdersByItem([item.id]);
  return toCatalogItemResponse(item, counts.get(item.id) ?? 0);
}

export async function archiveCatalogItem(id: string): Promise<CatalogItemResponse> {
  return updateCatalogItem(id, { status: "ARCHIVED" });
}
