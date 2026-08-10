import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
} from "./notifications.controller.js";

export async function notificationsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/notifications",
    { preHandler: [authenticate] },
    handleGetNotifications,
  );

  // PATCH /read-all deve vir antes de PATCH /:id para não conflitar com o parâmetro dinâmico
  app.patch(
    "/api/notifications/read-all",
    { preHandler: [authenticate] },
    handleMarkAllRead,
  );

  app.patch<{ Params: { id: string } }>(
    "/api/notifications/:id/read",
    { preHandler: [authenticate] },
    handleMarkRead,
  );
}
