import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role, ApprovalStatus } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
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

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { doctorProfile: { select: { approvalStatus: true } } },
    });
    if (!user) {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Usuário não encontrado." },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.doctorProfile ? { doctorApprovalStatus: user.doctorProfile.approvalStatus } : {}),
    };
  } catch {
    throw new AppError(401, "TOKEN_EXPIRED", "Token expirado ou inválido.");
  }
}
