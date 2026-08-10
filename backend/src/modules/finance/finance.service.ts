import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createAuditLog } from "../../lib/audit-log.js";
import type {
  CreateFinancialEntryInput,
  UpdateFinancialEntryInput,
  ListFinancialEntriesQuery,
  FinancialEntryResponse,
  FinancialSummaryResponse,
} from "./finance.schemas.js";
import type { FinancialEntry } from "@prisma/client";

type Actor = { id: string; name: string; role: string };

function toFinancialEntryResponse(entry: FinancialEntry): FinancialEntryResponse {
  return {
    id: entry.id,
    type: entry.type,
    category: entry.category,
    description: entry.description,
    amount: entry.amount.toString(),
    entryDate: entry.entryDate.toISOString(),
    receiptUrl: entry.receiptUrl,
    createdByUserId: entry.createdByUserId,
    createdAt: entry.createdAt.toISOString(),
  };
}

/**
 * Cria um lançamento financeiro sem necessidade de ator autenticado — usado
 * pelos gatilhos automáticos (pedido pago → entrada, comissão lançada → saída),
 * espelhando o comportamento do peptideo.
 */
export async function recordAutoFinancialEntry(data: {
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: number;
}): Promise<void> {
  try {
    await prisma.financialEntry.create({
      data: { ...data, entryDate: new Date() },
    });
  } catch (err) {
    console.error("[finance] Falha ao criar lançamento automático:", err);
  }
}

export async function listFinancialEntries(query: ListFinancialEntriesQuery): Promise<FinancialEntryResponse[]> {
  const entries = await prisma.financialEntry.findMany({
    where: {
      ...(query.type ? { type: query.type } : {}),
      ...(query.from || query.to
        ? { entryDate: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
    },
    orderBy: { entryDate: "desc" },
  });
  return entries.map(toFinancialEntryResponse);
}

export async function getFinancialSummary(): Promise<FinancialSummaryResponse> {
  const entries = await prisma.financialEntry.findMany();

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategoryIncome = new Map<string, number>();
  const byCategoryExpense = new Map<string, number>();

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === "INCOME") {
      totalIncome += amount;
      byCategoryIncome.set(entry.category, (byCategoryIncome.get(entry.category) ?? 0) + amount);
    } else {
      totalExpense += amount;
      byCategoryExpense.set(entry.category, (byCategoryExpense.get(entry.category) ?? 0) + amount);
    }
  }

  const toList = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([category, total]) => ({ category, total: total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    balance: (totalIncome - totalExpense).toFixed(2),
    byCategoryIncome: toList(byCategoryIncome),
    byCategoryExpense: toList(byCategoryExpense),
  };
}

export async function createFinancialEntry(
  actor: Actor,
  input: CreateFinancialEntryInput,
): Promise<FinancialEntryResponse> {
  const entry = await prisma.financialEntry.create({
    data: { ...input, createdByUserId: actor.id },
  });
  void createAuditLog(actor, "FINANCIAL_ENTRY_CREATED", `${input.type} R$ ${input.amount} — ${input.description}`);
  return toFinancialEntryResponse(entry);
}

export async function updateFinancialEntry(
  actor: Actor,
  id: string,
  input: UpdateFinancialEntryInput,
): Promise<FinancialEntryResponse> {
  const existing = await prisma.financialEntry.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "FINANCIAL_ENTRY_NOT_FOUND", "Lançamento não encontrado.");
  }
  const updated = await prisma.financialEntry.update({ where: { id }, data: input });
  void createAuditLog(actor, "FINANCIAL_ENTRY_UPDATED", updated.description);
  return toFinancialEntryResponse(updated);
}

export async function deleteFinancialEntry(actor: Actor, id: string): Promise<void> {
  const existing = await prisma.financialEntry.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "FINANCIAL_ENTRY_NOT_FOUND", "Lançamento não encontrado.");
  }
  await prisma.financialEntry.delete({ where: { id } });
  void createAuditLog(actor, "FINANCIAL_ENTRY_DELETED", existing.description);
}

export async function listFinancialCategories(): Promise<{ id: string; name: string }[]> {
  return prisma.financialCategory.findMany({ orderBy: { name: "asc" } });
}

export async function createFinancialCategory(name: string): Promise<{ id: string; name: string }> {
  const existing = await prisma.financialCategory.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.financialCategory.create({ data: { name } });
}
