import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role, ApprovalStatus } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "./error-handler.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      /** Só existe quando role === "DOCTOR". Ausente = sem DoctorProfile (nunca considerado aprovado). */
      doctorApprovalStatus?: ApprovalStatus;
    };
  }
}

/**
 * Nome/role/approvalStatus vêm direto do payload do access token — sem
 * consulta ao banco a cada request (cada round-trip custa ~1-1.5s nessa rede,
 * ver [[project-phase5-status]]). Só fica potencialmente desatualizado até o
 * token expirar/ser renovado (TTL curto, alguns minutos) — trade-off aceito.
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Token de acesso ausente ou inválido.",
      },
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      ...(payload.doctorApprovalStatus ? { doctorApprovalStatus: payload.doctorApprovalStatus } : {}),
    };
  } catch {
    throw new AppError(401, "TOKEN_EXPIRED", "Token expirado ou inválido.");
  }
}
