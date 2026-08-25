import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createAuditLog } from "../../lib/audit-log.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import { hashPassword } from "../../lib/hash.js";
import crypto from "node:crypto";
import type {
  UpdateFunnelStageInput,
  ListLeadsQuery,
  RequestReviewInput,
  CreateLeadInput,
  UpdateLeadInput,
  CreateActivityInput,
  CreateReminderInput,
  LeadResponse,
  LeadActivityResponse,
  LeadReminderResponse,
} from "./crm.schemas.js";
import type { DoctorProfile, User, LeadActivity, LeadReminder } from "@prisma/client";

type Actor = { id: string; name: string; role: string };

function toLeadResponse(profile: DoctorProfile & { user: User; assignedSalesRep: User | null }): LeadResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    email: profile.user.email,
    phone: profile.phone,
    crm: profile.crm,
    specialty: profile.specialty,
    profession: profile.profession,
    cpf: profile.cpf,
    clinicName: profile.clinicName,
    city: profile.city,
    state: profile.state,
    leadSource: profile.leadSource,
    approvalStatus: profile.approvalStatus,
    funnelStage: profile.funnelStage,
    lossReason: profile.lossReason,
    assignedSalesRepId: profile.assignedSalesRepId,
    assignedSalesRepName: profile.assignedSalesRep?.name ?? null,
    reviewRequestedAction: profile.reviewRequestedAction,
    createdAt: profile.createdAt.toISOString(),
  };
}

function toActivityResponse(activity: LeadActivity & { createdBy: User | null }): LeadActivityResponse {
  return {
    id: activity.id,
    doctorProfileId: activity.doctorProfileId,
    type: activity.type,
    note: activity.note,
    createdByUserId: activity.createdByUserId,
    createdByName: activity.createdBy?.name ?? null,
    createdAt: activity.createdAt.toISOString(),
  };
}

function toReminderResponse(reminder: LeadReminder & { createdBy: User | null }): LeadReminderResponse {
  return {
    id: reminder.id,
    doctorProfileId: reminder.doctorProfileId,
    label: reminder.label,
    dueAt: reminder.dueAt.toISOString(),
    done: reminder.done,
    createdByUserId: reminder.createdByUserId,
    createdByName: reminder.createdBy?.name ?? null,
    createdAt: reminder.createdAt.toISOString(),
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

/** Staff cadastra um contato/lead manualmente (ex.: chegou pelo Instagram, WhatsApp, evento). */
export async function createLead(actor: Actor, input: CreateLeadInput): Promise<LeadResponse> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Este e-mail já está em uso.");
  }

  const randomPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(randomPassword);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "DOCTOR",
      passwordHistory: { create: { passwordHash } },
      doctorProfile: {
        create: {
          phone: input.phone,
          profession: input.profession,
          specialty: input.specialty,
          crm: input.crm,
          cpf: input.cpf,
          clinicName: input.clinicName,
          city: input.city,
          state: input.state,
          leadSource: input.leadSource,
          assignedSalesRepId: actor.role === "SALES_REP" ? actor.id : (await pickNextSalesRep()) ?? undefined,
        },
      },
    },
    include: { doctorProfile: { include: { user: true, assignedSalesRep: true } } },
  });

  void createAuditLog(actor, "LEAD_CREATED", `${actor.name} cadastrou contato ${user.name}`);

  return toLeadResponse(user.doctorProfile as DoctorProfile & { user: User; assignedSalesRep: User | null });
}

/** Edita os dados de cadastro de um contato/lead. */
export async function updateLead(actor: Actor, leadId: string, input: UpdateLeadInput): Promise<LeadResponse> {
  const existing = await findLeadOrThrow(leadId);
  if (actor.role === "SALES_REP" && existing.assignedSalesRepId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "Você só pode editar leads atribuídos a você.");
  }

  const updated = await prisma.doctorProfile.update({
    where: { id: leadId },
    data: input,
    include: { user: true, assignedSalesRep: true },
  });

  return toLeadResponse(updated);
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
      lossReason: input.funnelStage === "LOST" || input.funnelStage === "WITHDRAWN" ? (input.lossReason ?? null) : null,
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

// ---------------------------------------------------------------------------
// Histórico completo (ligações, WhatsApp, e-mails, observações, pagamento)
// ---------------------------------------------------------------------------

async function assertLeadAccess(actor: Actor, leadId: string): Promise<DoctorProfile> {
  const lead = await prisma.doctorProfile.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new AppError(404, "LEAD_NOT_FOUND", "Lead não encontrado.");
  }
  if (actor.role === "SALES_REP" && lead.assignedSalesRepId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "Você só pode acessar leads atribuídos a você.");
  }
  return lead;
}

export async function listLeadActivities(actor: Actor, leadId: string): Promise<LeadActivityResponse[]> {
  await assertLeadAccess(actor, leadId);
  const activities = await prisma.leadActivity.findMany({
    where: { doctorProfileId: leadId },
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
  });
  return activities.map(toActivityResponse);
}

export async function createLeadActivity(
  actor: Actor,
  leadId: string,
  input: CreateActivityInput,
): Promise<LeadActivityResponse> {
  await assertLeadAccess(actor, leadId);
  const activity = await prisma.leadActivity.create({
    data: { doctorProfileId: leadId, type: input.type, note: input.note, createdByUserId: actor.id },
    include: { createdBy: true },
  });
  return toActivityResponse(activity);
}

// ---------------------------------------------------------------------------
// Agenda / lembretes
// ---------------------------------------------------------------------------

export async function listLeadReminders(actor: Actor, leadId: string): Promise<LeadReminderResponse[]> {
  await assertLeadAccess(actor, leadId);
  const reminders = await prisma.leadReminder.findMany({
    where: { doctorProfileId: leadId },
    include: { createdBy: true },
    orderBy: { dueAt: "asc" },
  });
  return reminders.map(toReminderResponse);
}

export async function createLeadReminder(
  actor: Actor,
  leadId: string,
  input: CreateReminderInput,
): Promise<LeadReminderResponse> {
  await assertLeadAccess(actor, leadId);
  const reminder = await prisma.leadReminder.create({
    data: { doctorProfileId: leadId, label: input.label, dueAt: input.dueAt, createdByUserId: actor.id },
    include: { createdBy: true },
  });
  return toReminderResponse(reminder);
}

export async function updateLeadReminder(
  actor: Actor,
  reminderId: string,
  done: boolean,
): Promise<LeadReminderResponse> {
  const existing = await prisma.leadReminder.findUnique({ where: { id: reminderId } });
  if (!existing) {
    throw new AppError(404, "LEAD_REMINDER_NOT_FOUND", "Lembrete não encontrado.");
  }
  await assertLeadAccess(actor, existing.doctorProfileId);
  const updated = await prisma.leadReminder.update({
    where: { id: reminderId },
    data: { done },
    include: { createdBy: true },
  });
  return toReminderResponse(updated);
}
