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
  handleDeleteCatalogItem,
  handleGetPublicCourse,
  handleCreateCourseRegistration,
  handleListCourseRegistrations,
  handleUpdateRegistrationStatus,
  handleListEnrolledDoctors,
  handleListCourseMaterials,
  handleCreateCourseMaterial,
  handleUpdateCourseMaterial,
  handleDeleteCourseMaterial,
  handleExpressCourseInterest,
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
  app.delete(
    "/api/catalog/:id",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleDeleteCatalogItem,
  );

  // Página pública do curso — sem login, médico parceiro sem conta demonstra interesse.
  app.get("/api/catalog/public/:slug", handleGetPublicCourse);
  app.post("/api/catalog/:id/register-interest", handleCreateCourseRegistration);

  // Médico já logado demonstra interesse num curso que ainda não comprou (mini
  // landing dentro do portal) — marca o curso no CRM, não cria pedido.
  app.post(
    "/api/catalog/:id/express-interest",
    { preHandler: [authenticate, requireApproved] },
    handleExpressCourseInterest,
  );

  // Roster do curso: interessados (formulário público) + inscritos reais (Order).
  // Staff sempre acessa; médico só se for o instrutor responsável (checado no service).
  app.get(
    "/api/catalog/:id/registrations",
    { preHandler: [authenticate, requireApproved] },
    handleListCourseRegistrations,
  );
  app.patch(
    "/api/catalog/:id/registrations/:regId",
    { preHandler: [authenticate, requireApproved] },
    handleUpdateRegistrationStatus,
  );
  app.get("/api/catalog/:id/orders", { preHandler: [authenticate, requireApproved] }, handleListEnrolledDoctors);

  // Materiais do curso (vídeos/PDFs/links) — médico vê se inscrito ou instrutor; gerencia se instrutor ou staff.
  app.get(
    "/api/catalog/:id/materials",
    { preHandler: [authenticate, requireApproved] },
    handleListCourseMaterials,
  );
  app.post(
    "/api/catalog/:id/materials",
    { preHandler: [authenticate, requireApproved] },
    handleCreateCourseMaterial,
  );
  app.patch(
    "/api/catalog/:id/materials/:materialId",
    { preHandler: [authenticate, requireApproved] },
    handleUpdateCourseMaterial,
  );
  app.delete(
    "/api/catalog/:id/materials/:materialId",
    { preHandler: [authenticate, requireApproved] },
    handleDeleteCourseMaterial,
  );
}
