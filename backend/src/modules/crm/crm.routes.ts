import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import {
  handleListLeads,
  handleCreateLead,
  handleUpdateLead,
  handleUpdateFunnelStage,
  handleClaimLead,
  handleRequestReview,
  handleListLeadActivities,
  handleCreateLeadActivity,
  handleListLeadReminders,
  handleCreateLeadReminder,
  handleUpdateLeadReminder,
  handleGetPasswordSetupLink,
} from "./crm.controller.js";

export async function crmRoutes(app: FastifyInstance): Promise<void> {
  const crmStaff = requireRole("SALES_REP", "MANAGER", "ADMIN");

  app.get("/api/crm/leads", { preHandler: [authenticate, crmStaff] }, handleListLeads);
  app.post("/api/crm/leads", { preHandler: [authenticate, crmStaff] }, handleCreateLead);
  app.patch("/api/crm/leads/:id", { preHandler: [authenticate, crmStaff] }, handleUpdateLead);
  app.patch("/api/crm/leads/:id/funnel", { preHandler: [authenticate, crmStaff] }, handleUpdateFunnelStage);
  app.patch("/api/crm/leads/:id/claim", { preHandler: [authenticate, crmStaff] }, handleClaimLead);
  app.patch("/api/crm/leads/:id/request-review", { preHandler: [authenticate, crmStaff] }, handleRequestReview);
  app.get(
    "/api/crm/leads/:id/password-link",
    { preHandler: [authenticate, crmStaff] },
    handleGetPasswordSetupLink,
  );

  app.get("/api/crm/leads/:id/activities", { preHandler: [authenticate, crmStaff] }, handleListLeadActivities);
  app.post("/api/crm/leads/:id/activities", { preHandler: [authenticate, crmStaff] }, handleCreateLeadActivity);

  app.get("/api/crm/leads/:id/reminders", { preHandler: [authenticate, crmStaff] }, handleListLeadReminders);
  app.post("/api/crm/leads/:id/reminders", { preHandler: [authenticate, crmStaff] }, handleCreateLeadReminder);
  app.patch(
    "/api/crm/leads/:id/reminders/:reminderId",
    { preHandler: [authenticate, crmStaff] },
    handleUpdateLeadReminder,
  );
}
