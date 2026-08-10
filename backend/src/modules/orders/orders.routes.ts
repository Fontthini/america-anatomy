import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { requireApproved } from "../../middlewares/require-approved.js";
import { handleCreateOrder, handleListMyOrders } from "./orders.controller.js";

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/orders",
    { preHandler: [authenticate, requireRole("DOCTOR"), requireApproved] },
    handleCreateOrder,
  );
  app.get(
    "/api/orders/me",
    { preHandler: [authenticate, requireRole("DOCTOR"), requireApproved] },
    handleListMyOrders,
  );
}
