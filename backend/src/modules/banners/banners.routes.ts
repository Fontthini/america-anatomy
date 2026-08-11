import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { requireApproved } from "../../middlewares/require-approved.js";
import { handleListBanners, handleCreateBanner, handleUpdateBanner, handleDeleteBanner } from "./banners.controller.js";

export async function bannersRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/banners", { preHandler: [authenticate, requireApproved] }, handleListBanners);

  const staffOnly = requireRole("MANAGER", "ADMIN");
  app.post("/api/banners", { preHandler: [authenticate, staffOnly] }, handleCreateBanner);
  app.patch("/api/banners/:id", { preHandler: [authenticate, staffOnly] }, handleUpdateBanner);
  app.delete("/api/banners/:id", { preHandler: [authenticate, staffOnly] }, handleDeleteBanner);
}
