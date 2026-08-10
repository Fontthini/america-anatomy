import { z } from "zod";
import type { FinancialEntryType } from "@prisma/client";

export const createFinancialEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1).max(60),
  description: z.string().min(1).max(300),
  amount: z.number().positive(),
  entryDate: z.coerce.date(),
  receiptUrl: z.string().url().optional(),
});

export const updateFinancialEntrySchema = createFinancialEntrySchema.partial();

export const listFinancialEntriesQuerySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createFinancialCategorySchema = z.object({
  name: z.string().min(1).max(60),
});

export type CreateFinancialEntryInput = z.infer<typeof createFinancialEntrySchema>;
export type UpdateFinancialEntryInput = z.infer<typeof updateFinancialEntrySchema>;
export type ListFinancialEntriesQuery = z.infer<typeof listFinancialEntriesQuerySchema>;
export type CreateFinancialCategoryInput = z.infer<typeof createFinancialCategorySchema>;

export type FinancialEntryResponse = {
  id: string;
  type: FinancialEntryType;
  category: string;
  description: string;
  amount: string;
  entryDate: string;
  receiptUrl: string | null;
  createdByUserId: string | null;
  createdAt: string;
};

export type FinancialSummaryResponse = {
  totalIncome: string;
  totalExpense: string;
  balance: string;
  byCategoryIncome: { category: string; total: string }[];
  byCategoryExpense: { category: string; total: string }[];
};
