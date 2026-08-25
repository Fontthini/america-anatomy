import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import {
  handleRegisterDoctor,
  handleGetMyDoctorProfile,
  handleListDoctors,
  handleApproveDoctor,
  handleRejectDoctor,
  handleDeleteDoctor,
} from "./doctors.controller.js";

export async function doctorsRoutes(app: FastifyInstance): Promise<void> {
  // Pública — cadastro de médico
  app.post("/api/doctors/register", handleRegisterDoctor);

  // Médico autenticado — próprio perfil/status de aprovação
  app.get("/api/doctors/me", { preHandler: [authenticate] }, handleGetMyDoctorProfile);

  // Staff/Admin — gestão de aprovação
  app.get(
    "/api/doctors",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleListDoctors,
  );
  app.patch(
    "/api/doctors/:id/approve",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleApproveDoctor,
  );
  app.patch(
    "/api/doctors/:id/reject",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleRejectDoctor,
  );
  // Apaga de verdade (não é rejeitar) — só ADMIN, ação sem volta.
  app.delete(
    "/api/doctors/:id",
    { preHandler: [authenticate, requireRole("ADMIN")] },
    handleDeleteDoctor,
  );
}
