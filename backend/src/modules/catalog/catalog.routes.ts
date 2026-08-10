import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { requireApproved } from "../../middlewares/require-approved.js";
import {
  handleListCatalogItems,
  handleGetCatalogItem,
  handleCreateCatalogItem,
  handleUpdateCatalogItem,
  handleArchiveCatalogItem,
} from "./catalog.controller.js";

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/catalog", { preHandler: [authenticate, requireApproved] }, handleListCatalogItems);
  app.get("/api/catalog/:id", { preHandler: [authenticate, requireApproved] }, handleGetCatalogItem);

  app.post(
    "/api/catalog",
    { preHandler: [authenticate, requireRole("STAFF", "ADMIN")] },
    handleCreateCatalogItem,
  );
  app.patch(
    "/api/catalog/:id",
    { preHandler: [authenticate, requireRole("STAFF", "ADMIN")] },
    handleUpdateCatalogItem,
  );
  app.patch(
    "/api/catalog/:id/archive",
    { preHandler: [authenticate, requireRole("STAFF", "ADMIN")] },
    handleArchiveCatalogItem,
  );
}
