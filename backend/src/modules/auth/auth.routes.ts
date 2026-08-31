import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  handleMe,
  handleConfirmEmail,
  handleResendConfirmation,
  handleForgotPassword,
  handleResetPassword,
} from "./auth.controller.js";

// Limite rígido para rotas de auth sensíveis a força bruta (login, código OTP,
// reset de senha): poucas tentativas por IP a cada minuto, contadas por rota.
const strictAuthRateLimit = { rateLimit: { max: 10, timeWindow: "1 minute" } };

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Rotas públicas — autenticação
  app.post("/api/auth/register", { config: strictAuthRateLimit }, handleRegister);
  app.post("/api/auth/login", { config: strictAuthRateLimit }, handleLogin);
  app.post("/api/auth/refresh", handleRefresh);
  app.post("/api/auth/logout", handleLogout);

  // Rotas públicas — e-mail (OTP e reset de senha, alvo de força bruta)
  app.post("/api/auth/confirm-email", { config: strictAuthRateLimit }, handleConfirmEmail);
  app.post("/api/auth/resend-confirmation", { config: strictAuthRateLimit }, handleResendConfirmation);
  app.post("/api/auth/forgot-password", { config: strictAuthRateLimit }, handleForgotPassword);
  app.post("/api/auth/reset-password", { config: strictAuthRateLimit }, handleResetPassword);

  // Rota protegida
  app.get("/api/auth/me", { preHandler: [authenticate] }, handleMe);
}
