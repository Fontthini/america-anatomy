import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { uploadFile, deleteFile, extractPathFromCdnUrl } from "../../lib/storage.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import type { UpdateProfileInput, UpdatePreferencesInput } from "./users.schemas.js";
import type { UserResponse } from "../auth/auth.schemas.js";
import type { Role } from "@prisma/client";

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: Role;
  emailVerified: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    emailNotifications: user.emailNotifications,
    productUpdates: user.productUpdates,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    ...(user.bio ? { bio: user.bio } : {}),
  };
}

/** Atualiza nome e bio do usuário autenticado. */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
    },
  });

  void createNotification(userId, NotificationType.PROFILE_UPDATED);

  return toUserResponse(user);
}

/** Faz upload de avatar para Bunny.net e atualiza avatarUrl no banco. */
export async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UserResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Usuário não encontrado.");
  }

  // Timestamp no nome garante URL única a cada upload, quebrando o cache do navegador/CDN
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const filePath = `avatars/${userId}/${Date.now()}.${ext}`;

  // Faz upload do novo arquivo
  const newAvatarUrl = await uploadFile(filePath, buffer, mimeType);

  // Remove avatar antigo se for de tipo diferente (extensão diferente)
  if (user.avatarUrl) {
    const oldPath = extractPathFromCdnUrl(user.avatarUrl);
    if (oldPath && oldPath !== filePath) {
      void deleteFile(oldPath);
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: newAvatarUrl },
  });

  void createNotification(userId, NotificationType.AVATAR_UPDATED);

  return toUserResponse(updated);
}

/** Atualiza as preferências de notificação do usuário autenticado. */
export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput,
): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
  });

  return toUserResponse(user);
}
