import { z } from "zod";
import type { FunnelStage, ApprovalStatus, LeadSource, LeadActivityType } from "@prisma/client";

export const FUNNEL_STAGES = [
  "NEW",
  "FIRST_CONTACT",
  "AWAITING_RESPONSE",
  "INFO_RECEIVED",
  "INTERESTED",
  "PAYMENT_LINK_SENT",
  "CUSTOMER",
  "WITHDRAWN",
  "LOST",
] as const;

export const LEAD_SOURCES = [
  "INSTAGRAM",
  "FACEBOOK",
  "GOOGLE",
  "LINKEDIN",
  "SITE",
  "INDICACAO",
  "CONGRESSO",
  "EVENTO",
  "WHATSAPP_UNINGA",
  "EX_ALUNO",
  "OUTRO",
] as const;

export const LEAD_ACTIVITY_TYPES = ["CALL", "WHATSAPP", "EMAIL", "NOTE", "PAYMENT_METHOD"] as const;

export const updateFunnelStageSchema = z.object({
  funnelStage: z.enum(FUNNEL_STAGES),
  lossReason: z.string().max(200).optional(),
});

export const listLeadsQuerySchema = z.object({
  funnelStage: z.enum(FUNNEL_STAGES).optional(),
  scope: z.enum(["mine", "unassigned", "all"]).optional(),
  courseOfInterestId: z.string().optional(),
});

export const requestReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

/** Cadastro manual de contato/lead direto pelo CRM (sem passar pelo formulário público). */
export const createLeadSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(150),
  email: z.string().email("E-mail inválido."),
  phone: z.string().max(30).optional(),
  profession: z.string().max(80).optional(),
  specialty: z.string().max(100).optional(),
  crm: z.string().max(30).optional(),
  cpf: z.string().max(20).optional(),
  clinicName: z.string().max(150).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  leadSource: z.enum(LEAD_SOURCES).optional(),
});

export const updateLeadSchema = z.object({
  phone: z.string().max(30).optional(),
  profession: z.string().max(80).optional(),
  specialty: z.string().max(100).optional(),
  crm: z.string().max(30).optional(),
  cpf: z.string().max(20).optional(),
  clinicName: z.string().max(150).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  leadSource: z.enum(LEAD_SOURCES).optional(),
});

export const createActivitySchema = z.object({
  type: z.enum(LEAD_ACTIVITY_TYPES),
  note: z.string().min(1, "Descreva o que aconteceu.").max(1000),
});

export const createReminderSchema = z.object({
  label: z.string().min(1, "Descreva o lembrete.").max(200),
  dueAt: z.coerce.date(),
});

export const updateReminderSchema = z.object({
  done: z.boolean(),
});

export type UpdateFunnelStageInput = z.infer<typeof updateFunnelStageSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type RequestReviewInput = z.infer<typeof requestReviewSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

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
  courseOfInterestId: string | null;
  courseOfInterestTitle: string | null;
  approvalStatus: ApprovalStatus;
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
