/**
 * Funções de API do CRM — funil de vendas.
 * Contrato: backend/docs/api-contract.md — seção CRM (/api/crm/)
 */

import { apiFetch } from "./client";

export type FunnelStage =
  | "NEW"
  | "FIRST_CONTACT"
  | "AWAITING_RESPONSE"
  | "INTERESTED"
  | "PAYMENT_LINK_SENT"
  | "CUSTOMER"
  | "LOST";

export type LeadResponse = {
  id: string;
  userId: string;
  name: string;
  email: string;
  crm: string | null;
  specialty: string | null;
  clinicName: string | null;
  city: string | null;
  state: string | null;
  approvalStatus: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  funnelStage: FunnelStage;
  lossReason: string | null;
  assignedSalesRepId: string | null;
  assignedSalesRepName: string | null;
  reviewRequestedAction: "APPROVE" | "REJECT" | null;
  createdAt: string;
};

/** GET /api/crm/leads?funnelStage=&scope= */
export async function apiListLeads(filters?: {
  funnelStage?: FunnelStage;
  scope?: "mine" | "unassigned" | "all";
}): Promise<LeadResponse[]> {
  const params = new URLSearchParams();
  if (filters?.funnelStage) params.set("funnelStage", filters.funnelStage);
  if (filters?.scope) params.set("scope", filters.scope);
  const qs = params.toString();
  return apiFetch<LeadResponse[]>(`/api/crm/leads${qs ? `?${qs}` : ""}`);
}

/** PATCH /api/crm/leads/:id/funnel */
export async function apiUpdateFunnelStage(
  id: string,
  funnelStage: FunnelStage,
  lossReason?: string,
): Promise<LeadResponse> {
  return apiFetch<LeadResponse>(`/api/crm/leads/${id}/funnel`, {
    method: "PATCH",
    body: JSON.stringify({ funnelStage, lossReason }),
  });
}

/** PATCH /api/crm/leads/:id/claim */
export async function apiClaimLead(id: string): Promise<LeadResponse> {
  return apiFetch<LeadResponse>(`/api/crm/leads/${id}/claim`, { method: "PATCH" });
}

/** PATCH /api/crm/leads/:id/request-review */
export async function apiRequestLeadReview(id: string, action: "APPROVE" | "REJECT"): Promise<LeadResponse> {
  return apiFetch<LeadResponse>(`/api/crm/leads/${id}/request-review`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}
