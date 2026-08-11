import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import type { CreateBannerInput, UpdateBannerInput, ListBannersQuery, BannerResponse } from "./banners.schemas.js";
import type { Banner } from "@prisma/client";

function toBannerResponse(banner: Banner): BannerResponse {
  return {
    id: banner.id,
    placement: banner.placement,
    imageUrl: banner.imageUrl,
    title: banner.title,
    subtitle: banner.subtitle,
    active: banner.active,
    order: banner.order,
    createdAt: banner.createdAt.toISOString(),
  };
}

/** Médicos só enxergam banners ativos do placement pedido; staff/admin enxergam todos (pra gestão). */
export async function listBanners(query: ListBannersQuery, isStaffOrAdmin: boolean): Promise<BannerResponse[]> {
  const banners = await prisma.banner.findMany({
    where: {
      ...(query.placement ? { placement: query.placement } : {}),
      ...(isStaffOrAdmin ? {} : { active: true }),
    },
    orderBy: { order: "asc" },
  });
  return banners.map(toBannerResponse);
}

export async function createBanner(input: CreateBannerInput): Promise<BannerResponse> {
  const banner = await prisma.banner.create({ data: input });
  return toBannerResponse(banner);
}

export async function updateBanner(id: string, input: UpdateBannerInput): Promise<BannerResponse> {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "BANNER_NOT_FOUND", "Banner não encontrado.");
  }
  const banner = await prisma.banner.update({ where: { id }, data: input });
  return toBannerResponse(banner);
}

export async function deleteBanner(id: string): Promise<void> {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "BANNER_NOT_FOUND", "Banner não encontrado.");
  }
  await prisma.banner.delete({ where: { id } });
}
