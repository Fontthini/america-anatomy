import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { requireApproved } from "../../middlewares/require-approved.js";
import {
  handleListArticles,
  handleGetArticle,
  handleCreateArticle,
  handleUpdateArticle,
  handleDeleteArticle,
} from "./blog.controller.js";

export async function blogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/articles", { preHandler: [authenticate, requireApproved] }, handleListArticles);
  app.get("/api/articles/:id", { preHandler: [authenticate, requireApproved] }, handleGetArticle);

  const staffOnly = requireRole("MANAGER", "ADMIN");
  app.post("/api/articles", { preHandler: [authenticate, staffOnly] }, handleCreateArticle);
  app.patch("/api/articles/:id", { preHandler: [authenticate, staffOnly] }, handleUpdateArticle);
  app.delete("/api/articles/:id", { preHandler: [authenticate, staffOnly] }, handleDeleteArticle);
}
