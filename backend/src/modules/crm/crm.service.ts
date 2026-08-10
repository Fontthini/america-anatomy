import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createAuditLog } from "../../lib/audit-log.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import type { UpdateFunnelStageInput, ListLeadsQuery, RequestReviewInput, LeadResponse } from "./crm.schemas.js";
import type { DoctorProfile, User } from "@prisma/client";

type Actor = { id: string; name: string; role: string };

function toLeadResponse(profile: DoctorProfile & { user: User; assignedSalesRep: User | null }): LeadResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    email: profile.user.email,
    crm: profile.crm,
    specialty: profile.specialty,
    clinicName: profile.clinicName,
    city: profile.city,
    state: profile.state,
    approvalStatus: profile.approvalStatus,
    funnelStage: profile.funnelStage,
    lossReason: profile.lossReason,
    assignedSalesRepId: profile.assignedSalesRepId,
    assignedSalesRepName: profile.assignedSalesRep?.name ?? null,
    reviewRequestedAction: profile.reviewRequestedAction,
    createdAt: profile.createdAt.toISOString(),
  };
}

/**
 * Escolhe o próximo vendedor pra receber um lead novo — distribui pelo vendedor
 * ativo com menos leads atribuídos no momento (autoequilibrado, sem precisar
 * de um cursor global persistido como o round-robin do peptideo).
 */
export async function pickNextSalesRep(): Promise<string | null> {
  const salesReps = await prisma.user.findMany({
    where: { role: "SALES_REP" },
    select: { id: true, createdAt: true, _count: { select: { assignedLeads: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (salesReps.length === 0) return null;
  const sorted = [...salesReps].sort((a, b) => a._count.assignedLeads - b._count.assignedLeads);
  return sorted[0]!.id;
}

/** Vendedor enxerga só os próprios leads + os não atribuídos. Gerente/admin enxergam tudo. */
export async function listLeads(actor: Actor, query: ListLeadsQuery): Promise<LeadResponse[]> {
  const isRestricted = actor.role === "SALES_REP";

  const scopeWhere = isRestricted
    ? query.scope === "mine"
      ? { assignedSalesRepId: actor.id }
      : query.scope === "unassigned"
        ? { assignedSalesRepId: null }
        : { OR: [{ assignedSalesRepId: actor.id }, { assignedSalesRepId: null }] }
    : query.scope === "mine"
      ? { assignedSalesRepId: actor.id }
      : query.scope === "unassigned"
        ? { assignedSalesRepId: null }
        : {};

  const profiles = await prisma.doctorProfile.findMany({
    where: {
      ...scopeWhere,
      ...(query.funnelStage ? { funnelStage: query.funnelStage } : {}),
    },
    include: { user: true, assignedSalesRep: true },
    orderBy: { createdAt: "desc" },
  });
  return profiles.map(toLeadResponse);
}

async function findLeadOrThrow(id: string): Promise<DoctorProfile & { user: User; assignedSalesRep: User | null }> {
  const profile = await prisma.doctorProfile.findUnique({
    where: { id },
    include: { user: true, assignedSalesRep: true },
  });
  if (!profile) {
    throw new AppError(404, "LEAD_NOT_FOUND", "Lead não encontrado.");
  }
  return profile;
}

export async function updateFunnelStage(
  actor: Actor,
  leadId: string,
  input: UpdateFunnelStageInput,
): Promise<LeadResponse> {
  const existing = await findLeadOrThrow(leadId);
  if (actor.role === "SALES_REP" && existing.assignedSalesRepId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "Você só pode mover leads atribuídos a você.");
  }

  const updated = await prisma.doctorProfile.update({
    where: { id: leadId },
    data: {
      funnelStage: input.funnelStage,
      lossReason: input.funnelStage === "LOST" ? (input.lossReason ?? null) : null,
    },
    include: { user: true, assignedSalesRep: true },
  });

  void createAuditLog(
    actor,
    "FUNNEL_STAGE_UPDATED",
    `${updated.user.name}: ${existing.funnelStage} → ${updated.funnelStage}`,
  );

  return toLeadResponse(updated);
}

/** Vendedor assume um lead sem vendedor atribuído. */
export async function claimLead(actor: Actor, leadId: string): Promise<LeadResponse> {
  const existing = await findLeadOrThrow(leadId);
  if (existing.assignedSalesRepId) {
    throw new AppError(409, "LEAD_ALREADY_ASSIGNED", "Este lead já tem um vendedor responsável.");
  }
  const updated = await prisma.doctorProfile.update({
    where: { id: leadId },
    data: { assignedSalesRepId: actor.id },
    include: { user: true, assignedSalesRep: true },
  });
  void createAuditLog(actor, "LEAD_CLAIMED", `${updated.user.name} assumido por ${actor.name}`);
  return toLeadResponse(updated);
}

/** Vendedor não decide aprovação/rejeição diretamente — solicita a um gerente/admin. */
export async function requestReview(
  actor: Actor,
  leadId: string,
  input: RequestReviewInput,
): Promise<LeadResponse> {
  const existing = await findLeadOrThrow(leadId);
  if (actor.role === "SALES_REP" && existing.assignedSalesRepId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "Você só pode solicitar revisão de leads atribuídos a você.");
  }

  const updated = await prisma.doctorProfile.update({
    where: { id: leadId },
    data: { approvalStatus: "IN_REVIEW", reviewRequestedAction: input.action },
    include: { user: true, assignedSalesRep: true },
  });

  const managers = await prisma.user.findMany({ where: { role: { in: ["MANAGER", "ADMIN"] } }, select: { id: true } });
  for (const manager of managers) {
    void createNotification(manager.id, NotificationType.LEAD_REVIEW_REQUESTED);
  }
  void createAuditLog(
    actor,
    "LEAD_REVIEW_REQUESTED",
    `${actor.name} solicitou ${input.action === "APPROVE" ? "aprovação" : "rejeição"} de ${updated.user.name}`,
  );

  return toLeadResponse(updated);
}
