import type { FastifyRequest, FastifyReply } from "fastify";
import { doctorRegisterSchema, listDoctorsQuerySchema } from "./doctors.schemas.js";
import { registerDoctor, getMyDoctorProfile, listDoctors, deleteDoctor } from "./doctors.service.js";
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

export async function handleDeleteDoctor(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  await deleteDoctor(id);
  reply.status(204).send();
}
