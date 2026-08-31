import type { FastifyRequest, FastifyReply } from "fastify";
import { updateProfileSchema, updatePreferencesSchema, ALLOWED_AVATAR_TYPES } from "./users.schemas.js";
import { updateProfile, uploadAvatar, updatePreferences } from "./users.service.js";
import { AppError } from "../../middlewares/error-handler.js";

/**
 * Confere os magic bytes reais do arquivo — o `mimetype` do multipart é só o
 * Content-Type declarado pelo cliente, trivial de forjar (ex.: renomear um
 * .html malicioso pra "foto.png" e mandar com mimetype "image/png").
 */
function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

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

  // O mimetype acima é só o que o cliente declarou (forjável). Confirma pelos
  // bytes reais do arquivo antes de aceitar.
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime || !ALLOWED_AVATAR_TYPES.includes(detectedMime as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      `O conteúdo do arquivo não corresponde a um tipo permitido. Use: ${ALLOWED_AVATAR_TYPES.join(", ")}.`,
    );
  }

  const user = await uploadAvatar(req.user.id, buffer, detectedMime);
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
