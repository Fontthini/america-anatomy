import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(100),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres.").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

/** MIME types aceitos para avatar */
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number];
