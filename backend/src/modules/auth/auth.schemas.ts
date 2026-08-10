import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(100),
  email: z.string().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres.").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(1, "Senha é obrigatória."),
});

export const confirmEmailSchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos.").regex(/^\d{6}$/, "Código deve conter apenas números."),
});

export const resendConfirmationSchema = z.object({
  email: z.string().email("E-mail inválido.").toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido.").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório."),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres.").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>; // { code: string }
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Shape que o front-end espera (MockUser). Nunca inclui passwordHash. */
export type UserResponse = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  emailVerified: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
};

export type AuthResponse = {
  user: UserResponse;
  /** Access token — vai no body da resposta */
  token: string;
  /** Refresh token — vai apenas no cookie httpOnly, nunca no body */
  refreshToken: string;
};
