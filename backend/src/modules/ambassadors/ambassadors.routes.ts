import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import {
  handleCreateAmbassadorApplication,
  handleListAmbassadorApplications,
  handleUpdateAmbassadorApplicationStatus,
} from "./ambassadors.controller.js";

export async function ambassadorsRoutes(app: FastifyInstance): Promise<void> {
  // Formulário público — sem login.
  app.post("/api/ambassadors/apply", handleCreateAmbassadorApplication);

  const staffOnly = requireRole("MANAGER", "ADMIN");
  app.get("/api/ambassadors", { preHandler: [authenticate, staffOnly] }, handleListAmbassadorApplications);
  app.patch(
    "/api/ambassadors/:id/status",
    { preHandler: [authenticate, staffOnly] },
    handleUpdateAmbassadorApplicationStatus,
  );
}
