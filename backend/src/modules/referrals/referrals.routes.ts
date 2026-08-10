import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { requireApproved } from "../../middlewares/require-approved.js";
import {
  handleCreateReferral,
  handleListMyReferrals,
  handleListReferrals,
  handleUpdateReferralStatus,
  handleLaunchCommission,
} from "./referrals.controller.js";

export async function referralsRoutes(app: FastifyInstance): Promise<void> {
  // Médico aprovado indica paciente ou outro médico.
  app.post(
    "/api/referrals",
    { preHandler: [authenticate, requireRole("DOCTOR"), requireApproved] },
    handleCreateReferral,
  );
  app.get(
    "/api/referrals/me",
    { preHandler: [authenticate, requireRole("DOCTOR"), requireApproved] },
    handleListMyReferrals,
  );

  // Staff — vendedor só vê indicações dos médicos atribuídos a ele (checado no service).
  const crmStaff = requireRole("SALES_REP", "MANAGER", "ADMIN");
  app.get("/api/referrals", { preHandler: [authenticate, crmStaff] }, handleListReferrals);
  app.patch("/api/referrals/:id/status", { preHandler: [authenticate, crmStaff] }, handleUpdateReferralStatus);

  // Comissão é decisão financeira — só gerente/admin.
  app.put(
    "/api/referrals/:id/commission",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleLaunchCommission,
  );
}
