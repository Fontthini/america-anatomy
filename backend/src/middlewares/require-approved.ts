import type { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./error-handler.js";

/** No-op para STAFF/ADMIN (nunca passam por aprovação). Bloqueia DOCTOR sem approvalStatus === "APPROVED". */
export async function requireApproved(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (req.user.role === "DOCTOR" && req.user.doctorApprovalStatus !== "APPROVED") {
    throw new AppError(403, "DOCTOR_NOT_APPROVED", "Seu cadastro ainda não foi aprovado.", {
      approvalStatus: req.user.doctorApprovalStatus ?? "PENDING",
    });
  }
}
