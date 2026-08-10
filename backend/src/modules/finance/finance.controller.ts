import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createFinancialEntrySchema,
  updateFinancialEntrySchema,
  listFinancialEntriesQuerySchema,
  createFinancialCategorySchema,
} from "./finance.schemas.js";
import {
  listFinancialEntries,
  getFinancialSummary,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  listFinancialCategories,
  createFinancialCategory,
} from "./finance.service.js";

function actorFromReq(req: FastifyRequest) {
  return { id: req.user.id, name: req.user.name, role: req.user.role };
}

export async function handleListFinancialEntries(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listFinancialEntriesQuerySchema.parse(req.query);
  const entries = await listFinancialEntries(query);
  reply.status(200).send(entries);
}

export async function handleGetFinancialSummary(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const summary = await getFinancialSummary();
  reply.status(200).send(summary);
}

export async function handleCreateFinancialEntry(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createFinancialEntrySchema.parse(req.body);
  const entry = await createFinancialEntry(actorFromReq(req), input);
  reply.status(201).send(entry);
}

export async function handleUpdateFinancialEntry(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateFinancialEntrySchema.parse(req.body);
  const entry = await updateFinancialEntry(actorFromReq(req), id, input);
  reply.status(200).send(entry);
}

export async function handleDeleteFinancialEntry(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  await deleteFinancialEntry(actorFromReq(req), id);
  reply.status(204).send();
}

export async function handleListFinancialCategories(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const categories = await listFinancialCategories();
  reply.status(200).send(categories);
}

export async function handleCreateFinancialCategory(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createFinancialCategorySchema.parse(req.body);
  const category = await createFinancialCategory(input.name);
  reply.status(201).send(category);
}
