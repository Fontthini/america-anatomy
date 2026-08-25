/**
 * Funções de API do CRM — Contatos (funil de vendas, histórico, agenda).
 * Contrato: backend/docs/api-contract.md — seção CRM (/api/crm/)
 */

import { apiFetch } from "./client";

export type FunnelStage =
  | "NEW"
  | "FIRST_CONTACT"
  | "AWAITING_RESPONSE"
  | "INFO_RECEIVED"
  | "INTERESTED"
  | "PAYMENT_LINK_SENT"
  | "CUSTOMER"
  | "WITHDRAWN"
  | "LOST";

export type LeadSource =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "GOOGLE"
  | "LINKEDIN"
  | "SITE"
  | "INDICACAO"
  | "CONGRESSO"
  | "EVENTO"
  | "WHATSAPP_UNINGA"
  | "EX_ALUNO"
  | "OUTRO";

export type LeadActivityType = "CALL" | "WHATSAPP" | "EMAIL" | "NOTE" | "PAYMENT_METHOD";

export type LeadResponse = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  crm: string | null;
  specialty: string | null;
  profession: string | null;
  cpf: string | null;
  clinicName: string | null;
  city: string | null;
  state: string | null;
  leadSource: LeadSource | null;
  approvalStatus: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  funnelStage: FunnelStage;
  lossReason: string | null;
  assignedSalesRepId: string | null;
  assignedSalesRepName: string | null;
  reviewRequestedAction: "APPROVE" | "REJECT" | null;
  createdAt: string;
};

export type LeadActivityResponse = {
  id: string;
  doctorProfileId: string;
  type: LeadActivityType;
  note: string;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type LeadReminderResponse = {
  id: string;
  doctorProfileId: string;
  label: string;
  dueAt: string;
  done: boolean;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type CreateLeadPayload = {
  name: string;
  email: string;
  phone?: string;
  profession?: string;
  specialty?: string;
  crm?: string;
  cpf?: string;
  clinicName?: string;
  city?: string;
  state?: string;
  leadSource?: LeadSource;
};

export type UpdateLeadPayload = Partial<Omit<CreateLeadPayload, "name" | "email">>;

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

/** POST /api/crm/leads — cadastro manual de contato */
export async function apiCreateLead(payload: CreateLeadPayload): Promise<LeadResponse> {
  return apiFetch<LeadResponse>("/api/crm/leads", { method: "POST", body: JSON.stringify(payload) });
}

/** PATCH /api/crm/leads/:id — edita dados de cadastro do contato */
export async function apiUpdateLead(id: string, payload: UpdateLeadPayload): Promise<LeadResponse> {
  return apiFetch<LeadResponse>(`/api/crm/leads/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
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

// ---------------------------------------------------------------------------
// Histórico completo (ligações, WhatsApp, e-mails, observações, pagamento)
// ---------------------------------------------------------------------------

/** GET /api/crm/leads/:id/activities */
export async function apiListLeadActivities(leadId: string): Promise<LeadActivityResponse[]> {
  return apiFetch<LeadActivityResponse[]>(`/api/crm/leads/${leadId}/activities`);
}

/** POST /api/crm/leads/:id/activities */
export async function apiCreateLeadActivity(
  leadId: string,
  payload: { type: LeadActivityType; note: string },
): Promise<LeadActivityResponse> {
  return apiFetch<LeadActivityResponse>(`/api/crm/leads/${leadId}/activities`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Agenda / lembretes
// ---------------------------------------------------------------------------

/** GET /api/crm/leads/:id/reminders */
export async function apiListLeadReminders(leadId: string): Promise<LeadReminderResponse[]> {
  return apiFetch<LeadReminderResponse[]>(`/api/crm/leads/${leadId}/reminders`);
}

/** POST /api/crm/leads/:id/reminders */
export async function apiCreateLeadReminder(
  leadId: string,
  payload: { label: string; dueAt: string },
): Promise<LeadReminderResponse> {
  return apiFetch<LeadReminderResponse>(`/api/crm/leads/${leadId}/reminders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/crm/leads/:id/reminders/:reminderId */
export async function apiUpdateLeadReminder(
  leadId: string,
  reminderId: string,
  done: boolean,
): Promise<LeadReminderResponse> {
  return apiFetch<LeadReminderResponse>(`/api/crm/leads/${leadId}/reminders/${reminderId}`, {
    method: "PATCH",
    body: JSON.stringify({ done }),
  });
}
