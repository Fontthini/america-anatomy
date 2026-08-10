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
  handleGetPublicCourse,
  handleCreateCourseRegistration,
  handleListCourseRegistrations,
  handleUpdateRegistrationStatus,
  handleListEnrolledDoctors,
} from "./catalog.controller.js";

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/catalog", { preHandler: [authenticate, requireApproved] }, handleListCatalogItems);
  app.get("/api/catalog/:id", { preHandler: [authenticate, requireApproved] }, handleGetCatalogItem);

  app.post(
    "/api/catalog",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleCreateCatalogItem,
  );
  app.patch(
    "/api/catalog/:id",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleUpdateCatalogItem,
  );
  app.patch(
    "/api/catalog/:id/archive",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleArchiveCatalogItem,
  );

  // Página pública do curso — sem login, médico parceiro sem conta demonstra interesse.
  app.get("/api/catalog/public/:slug", handleGetPublicCourse);
  app.post("/api/catalog/:id/register-interest", handleCreateCourseRegistration);

  // Staff — roster do curso: interessados (formulário público) + inscritos reais (Order).
  const staffOnly = requireRole("MANAGER", "ADMIN");
  app.get(
    "/api/catalog/:id/registrations",
    { preHandler: [authenticate, staffOnly] },
    handleListCourseRegistrations,
  );
  app.patch(
    "/api/catalog/:id/registrations/:regId",
    { preHandler: [authenticate, staffOnly] },
    handleUpdateRegistrationStatus,
  );
  app.get("/api/catalog/:id/orders", { preHandler: [authenticate, staffOnly] }, handleListEnrolledDoctors);
}
