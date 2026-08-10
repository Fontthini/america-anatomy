import type { FastifyRequest, FastifyReply } from "fastify";
import { doctorRegisterSchema, rejectDoctorSchema, listDoctorsQuerySchema } from "./doctors.schemas.js";
import { registerDoctor, getMyDoctorProfile, listDoctors, approveDoctor, rejectDoctor } from "./doctors.service.js";
import { env } from "../../config/env.js";
import { refreshTokenTtlSeconds } from "../../lib/jwt.js";

const REFRESH_COOKIE = "bp.refresh";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: refreshTokenTtlSeconds(),
};

export async function handleRegisterDoctor(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = doctorRegisterSchema.parse(req.body);
  const result = await registerDoctor(input);
  reply
    .setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)
    .status(201)
    .send({ user: result.user, token: result.token });
}

export async function handleGetMyDoctorProfile(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const profile = await getMyDoctorProfile(req.user.id);
  reply.status(200).send(profile);
}

export async function handleListDoctors(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listDoctorsQuerySchema.parse(req.query);
  const profiles = await listDoctors(query.status);
  reply.status(200).send(profiles);
}

export async function handleApproveDoctor(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const profile = await approveDoctor({ id: req.user.id, name: req.user.name, role: req.user.role }, id);
  reply.status(200).send(profile);
}

export async function handleRejectDoctor(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = rejectDoctorSchema.parse(req.body ?? {});
  const profile = await rejectDoctor({ id: req.user.id, name: req.user.name, role: req.user.role }, id, input);
  reply.status(200).send(profile);
}
