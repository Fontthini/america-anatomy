import type { FastifyRequest, FastifyReply } from "fastify";
import { updateProfileSchema, updatePreferencesSchema, ALLOWED_AVATAR_TYPES } from "./users.schemas.js";
import { updateProfile, uploadAvatar, updatePreferences } from "./users.service.js";
import { AppError } from "../../middlewares/error-handler.js";

export async function handleUpdateProfile(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const input = updateProfileSchema.parse(req.body);
  const user = await updateProfile(req.user.id, input);
  reply.status(200).send(user);
}

export async function handleUploadAvatar(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await req.file();

  if (!data) {
    throw new AppError(400, "BAD_REQUEST", "Nenhum arquivo enviado.");
  }

  const mimeType = data.mimetype as string;
  if (!ALLOWED_AVATAR_TYPES.includes(mimeType as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      `Tipo de arquivo não permitido. Use: ${ALLOWED_AVATAR_TYPES.join(", ")}.`,
    );
  }

  // Lê o buffer completo do stream
  const buffer = await data.toBuffer();

  // @fastify/multipart seta truncated=true quando o limite de tamanho é excedido
  if ((data.file as { truncated?: boolean }).truncated) {
    throw new AppError(413, "FILE_TOO_LARGE", "Arquivo muito grande. Máximo permitido: 2 MB.");
  }

  const user = await uploadAvatar(req.user.id, buffer, mimeType);
  reply.status(200).send(user);
}

export async function handleUpdatePreferences(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const input = updatePreferencesSchema.parse(req.body);
  const user = await updatePreferences(req.user.id, input);
  reply.status(200).send(user);
}
