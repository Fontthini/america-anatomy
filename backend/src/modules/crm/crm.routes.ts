import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { handleListLeads, handleUpdateFunnelStage, handleClaimLead, handleRequestReview } from "./crm.controller.js";

export async function crmRoutes(app: FastifyInstance): Promise<void> {
  const crmStaff = requireRole("SALES_REP", "MANAGER", "ADMIN");

  app.get("/api/crm/leads", { preHandler: [authenticate, crmStaff] }, handleListLeads);
  app.patch("/api/crm/leads/:id/funnel", { preHandler: [authenticate, crmStaff] }, handleUpdateFunnelStage);
  app.patch("/api/crm/leads/:id/claim", { preHandler: [authenticate, crmStaff] }, handleClaimLead);
  app.patch("/api/crm/leads/:id/request-review", { preHandler: [authenticate, crmStaff] }, handleRequestReview);
}
