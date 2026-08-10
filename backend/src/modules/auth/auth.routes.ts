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

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Rotas públicas — autenticação
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/refresh", handleRefresh);
  app.post("/api/auth/logout", handleLogout);

  // Rotas públicas — e-mail
  app.post("/api/auth/confirm-email", handleConfirmEmail);
  app.post("/api/auth/resend-confirmation", handleResendConfirmation);
  app.post("/api/auth/forgot-password", handleForgotPassword);
  app.post("/api/auth/reset-password", handleResetPassword);

  // Rota protegida
  app.get("/api/auth/me", { preHandler: [authenticate] }, handleMe);
}
