import { z } from "zod";
import type { FunnelStage, ApprovalStatus } from "@prisma/client";

export const updateFunnelStageSchema = z.object({
  funnelStage: z.enum([
    "NEW",
    "FIRST_CONTACT",
    "AWAITING_RESPONSE",
    "INTERESTED",
    "PAYMENT_LINK_SENT",
    "CUSTOMER",
    "LOST",
  ]),
  lossReason: z.string().max(200).optional(),
});

export const listLeadsQuerySchema = z.object({
  funnelStage: z
    .enum(["NEW", "FIRST_CONTACT", "AWAITING_RESPONSE", "INTERESTED", "PAYMENT_LINK_SENT", "CUSTOMER", "LOST"])
    .optional(),
  scope: z.enum(["mine", "unassigned", "all"]).optional(),
});

export const requestReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export type UpdateFunnelStageInput = z.infer<typeof updateFunnelStageSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type RequestReviewInput = z.infer<typeof requestReviewSchema>;

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
  approvalStatus: ApprovalStatus;
  funnelStage: FunnelStage;
  lossReason: string | null;
  assignedSalesRepId: string | null;
  assignedSalesRepName: string | null;
  reviewRequestedAction: "APPROVE" | "REJECT" | null;
  createdAt: string;
};
