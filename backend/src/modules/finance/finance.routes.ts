import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import {
  handleListFinancialEntries,
  handleGetFinancialSummary,
  handleCreateFinancialEntry,
  handleUpdateFinancialEntry,
  handleDeleteFinancialEntry,
  handleListFinancialCategories,
  handleCreateFinancialCategory,
} from "./finance.controller.js";

/** Financeiro é restrito a MANAGER/ADMIN — vendedor não vê (mesma regra do peptideo). */
export async function financeRoutes(app: FastifyInstance): Promise<void> {
  const financeOnly = requireRole("MANAGER", "ADMIN");

  app.get("/api/finance/entries", { preHandler: [authenticate, financeOnly] }, handleListFinancialEntries);
  app.get("/api/finance/summary", { preHandler: [authenticate, financeOnly] }, handleGetFinancialSummary);
  app.post("/api/finance/entries", { preHandler: [authenticate, financeOnly] }, handleCreateFinancialEntry);
  app.patch("/api/finance/entries/:id", { preHandler: [authenticate, financeOnly] }, handleUpdateFinancialEntry);
  app.delete("/api/finance/entries/:id", { preHandler: [authenticate, financeOnly] }, handleDeleteFinancialEntry);
  app.get("/api/finance/categories", { preHandler: [authenticate, financeOnly] }, handleListFinancialCategories);
  app.post("/api/finance/categories", { preHandler: [authenticate, financeOnly] }, handleCreateFinancialCategory);
}
