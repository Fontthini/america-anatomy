import Fastify from "fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { registerCors } from "./plugins/cors.js";
import { registerCookie } from "./plugins/cookie.js";
import { registerErrorHandler } from "./middlewares/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { notificationsRoutes } from "./modules/notifications/notifications.routes.js";
import { doctorsRoutes } from "./modules/doctors/doctors.routes.js";
import { catalogRoutes } from "./modules/catalog/catalog.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { crmRoutes } from "./modules/crm/crm.routes.js";
import { financeRoutes } from "./modules/finance/finance.routes.js";
import { blogRoutes } from "./modules/blog/blog.routes.js";
import { bannersRoutes } from "./modules/banners/banners.routes.js";

export async function buildApp() {
  const isDev = process.env["NODE_ENV"] !== "production";
  const app = Fastify({
    logger: isDev
      ? { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } } }
      : true,
  });

  // Plugins
  await registerCors(app);
  await registerCookie(app);
  await app.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2 MB
      files: 1,
    },
  });
  // Rate limit global (defesa contra força bruta/DoS); rotas de auth sensíveis
  // recebem limites mais rígidos via `config.rateLimit` na própria rota.
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
  });

  // Error handler global
  registerErrorHandler(app);

  // Health check
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // Módulos
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(notificationsRoutes);
  await app.register(doctorsRoutes);
  await app.register(catalogRoutes);
  await app.register(ordersRoutes);
  await app.register(crmRoutes);
  await app.register(financeRoutes);
  await app.register(blogRoutes);
  await app.register(bannersRoutes);

  return app;
}
