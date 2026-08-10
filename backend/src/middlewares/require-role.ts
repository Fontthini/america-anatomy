import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "@prisma/client";
import { AppError } from "./error-handler.js";

export function requireRole(...roles: Role[]) {
  return async function requireRoleHandler(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para acessar este recurso.");
    }
  };
}
