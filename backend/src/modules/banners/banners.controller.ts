import type { FastifyRequest, FastifyReply } from "fastify";
import { createBannerSchema, updateBannerSchema, listBannersQuerySchema } from "./banners.schemas.js";
import { listBanners, createBanner, updateBanner, deleteBanner } from "./banners.service.js";

function isStaffOrAdmin(req: FastifyRequest): boolean {
  return req.user.role === "MANAGER" || req.user.role === "ADMIN";
}

export async function handleListBanners(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listBannersQuerySchema.parse(req.query);
  const banners = await listBanners(query, isStaffOrAdmin(req));
  reply.status(200).send(banners);
}

export async function handleCreateBanner(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createBannerSchema.parse(req.body);
  const banner = await createBanner(input);
  reply.status(201).send(banner);
}

export async function handleUpdateBanner(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateBannerSchema.parse(req.body);
  const banner = await updateBanner(id, input);
  reply.status(200).send(banner);
}

export async function handleDeleteBanner(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  await deleteBanner(id);
  reply.status(204).send();
}
