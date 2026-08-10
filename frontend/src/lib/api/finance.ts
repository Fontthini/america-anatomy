/**
 * Funções de API do financeiro.
 * Contrato: backend/docs/api-contract.md — seção Financeiro (/api/finance/)
 */

import { apiFetch } from "./client";

export type FinancialEntryType = "INCOME" | "EXPENSE";

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

export type CreateFinancialEntryPayload = {
  type: FinancialEntryType;
  category: string;
  description: string;
  amount: number;
  entryDate: string;
  receiptUrl?: string;
};

/** GET /api/finance/entries?type=&from=&to= */
export async function apiListFinancialEntries(filters?: {
  type?: FinancialEntryType;
}): Promise<FinancialEntryResponse[]> {
  const qs = filters?.type ? `?type=${filters.type}` : "";
  return apiFetch<FinancialEntryResponse[]>(`/api/finance/entries${qs}`);
}

/** GET /api/finance/summary */
export async function apiGetFinancialSummary(): Promise<FinancialSummaryResponse> {
  return apiFetch<FinancialSummaryResponse>("/api/finance/summary");
}

/** POST /api/finance/entries */
export async function apiCreateFinancialEntry(payload: CreateFinancialEntryPayload): Promise<FinancialEntryResponse> {
  return apiFetch<FinancialEntryResponse>("/api/finance/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** DELETE /api/finance/entries/:id */
export async function apiDeleteFinancialEntry(id: string): Promise<void> {
  await apiFetch<void>(`/api/finance/entries/${id}`, { method: "DELETE" });
}

/** GET /api/finance/categories */
export async function apiListFinancialCategories(): Promise<{ id: string; name: string }[]> {
  return apiFetch<{ id: string; name: string }[]>("/api/finance/categories");
}
