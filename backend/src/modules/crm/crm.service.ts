import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createAuditLog } from "../../lib/audit-log.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import { hashPassword } from "../../lib/hash.js";
import { createPasswordSetupLink } from "../auth/auth.service.js";
import { recordAutoFinancialEntry } from "../finance/finance.service.js";
import crypto from "node:crypto";
import type {
  UpdateFunnelStageInput,
  ListLeadsQuery,
  CreateLeadInput,
  UpdateLeadInput,
  CreateActivityInput,
  CreateReminderInput,
  LeadResponse,
  LeadActivityResponse,
  LeadReminderResponse,
} from "./crm.schemas.js";
import type { DoctorProfile, User, LeadActivity, LeadReminder, CatalogItem } from "@prisma/client";

type Actor = { id: string; name: string; role: string };
type LeadRow = DoctorProfile & { user: User; assignedSalesRep: User | null; courseOfInterest: CatalogItem | null };

const leadInclude = { user: true, assignedSalesRep: true, courseOfInterest: true } as const;

function toLeadResponse(profile: LeadRow): LeadResponse {
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
    courseOfInterestId: profile.courseOfInterestId,
    courseOfInterestTitle: profile.courseOfInterest?.title ?? null,
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
      ...(query.courseOfInterestId ? { courseOfInterestId: query.courseOfInterestId } : {}),
    },
    include: leadInclude,
    orderBy: { createdAt: "desc" },
  });
  return profiles.map(toLeadResponse);
}

async function findLeadOrThrow(id: string): Promise<LeadRow> {
  const profile = await prisma.doctorProfile.findUnique({
    where: { id },
    include: leadInclude,
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
    include: { doctorProfile: { include: leadInclude } },
  });

  void createAuditLog(actor, "LEAD_CREATED", `${actor.name} cadastrou contato ${user.name}`);

  return toLeadResponse(user.doctorProfile as LeadRow);
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
    include: leadInclude,
  });

  return toLeadResponse(updated);
}

/**
 * Quando um lead entra em "matrícula concluída" e tem um curso de interesse marcado,
 * concede acesso ao portal automaticamente: aprova o cadastro do médico (sem isso ele
 * não consegue nem logar em /medico) e cria o Order confirmado que libera materiais/
 * "Meus Pedidos" daquele curso — já que o pagamento em si acontece fora do sistema
 * (manual) e o CRM é quem representa "pago e matriculado", não uma etapa de aprovação
 * separada como a de médicos que se cadastram sozinhos pelo formulário público.
 */
async function grantCourseAccessOnEnrollment(doctorProfileId: string, courseId: string, userId: string): Promise<void> {
  try {
    await prisma.doctorProfile.updateMany({
      where: { id: doctorProfileId, approvalStatus: { not: "APPROVED" } },
      data: { approvalStatus: "APPROVED", approvedAt: new Date() },
    });

    const existingOrder = await prisma.order.findFirst({
      where: { doctorProfileId, catalogItemId: courseId, status: "CONFIRMED" },
    });
    if (existingOrder) return;

    const course = await prisma.catalogItem.findUnique({ where: { id: courseId } });
    if (!course) return;

    const order = await prisma.order.create({
      data: { doctorProfileId, catalogItemId: courseId, quantity: 1, status: "CONFIRMED", unitPrice: course.price },
    });

    void createNotification(userId, NotificationType.ORDER_CREATED);

    if (order.unitPrice) {
      void recordAutoFinancialEntry({
        type: "INCOME",
        category: "MATRÍCULA (CRM)",
        description: `Matrícula confirmada via CRM — ${course.title}`,
        amount: Number(order.unitPrice),
      });
    }
  } catch (err) {
    console.error("[crm] Falha ao conceder acesso ao curso na matrícula:", err);
  }
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
    include: leadInclude,
  });

  void createAuditLog(
    actor,
    "FUNNEL_STAGE_UPDATED",
    `${updated.user.name}: ${existing.funnelStage} → ${updated.funnelStage}`,
  );

  if (input.funnelStage === "CUSTOMER" && updated.courseOfInterestId) {
    void grantCourseAccessOnEnrollment(updated.id, updated.courseOfInterestId, updated.userId);
  }

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
    include: leadInclude,
  });
  void createAuditLog(actor, "LEAD_CLAIMED", `${updated.user.name} assumido por ${actor.name}`);
  return toLeadResponse(updated);
}


/**
 * Chamado a partir do formulário público de interesse num curso (landing page).
 * Sem ator autenticado — best-effort, nunca lança erro (não pode derrubar o
 * registro de interesse que já foi salvo). Se o e-mail já existe, só marca o
 * curso de interesse no contato existente e registra no histórico; senão,
 * cria um contato novo já dentro do funil, atribuído por round-robin.
 */
export async function upsertLeadFromCourseInterest(
  catalogItemId: string,
  courseTitle: string,
  input: { name: string; email: string; whatsapp: string; crm?: string; notes?: string },
): Promise<void> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      include: { doctorProfile: true },
    });

    if (existingUser?.doctorProfile) {
      await prisma.doctorProfile.update({
        where: { id: existingUser.doctorProfile.id },
        data: { courseOfInterestId: catalogItemId },
      });
      await prisma.leadActivity.create({
        data: {
          doctorProfileId: existingUser.doctorProfile.id,
          type: "NOTE",
          note: `Demonstrou interesse via landing page pública: ${courseTitle}${input.notes ? ` — "${input.notes}"` : ""}`,
        },
      });
      return;
    }
    if (existingUser) return; // e-mail já usado por conta que não é médico (staff) — não mexe

    const randomPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = await hashPassword(randomPassword);
    const assignedSalesRepId = (await pickNextSalesRep()) ?? undefined;

    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "DOCTOR",
        passwordHistory: { create: { passwordHash } },
        doctorProfile: {
          create: {
            phone: input.whatsapp,
            crm: input.crm,
            leadSource: "SITE",
            courseOfInterestId: catalogItemId,
            assignedSalesRepId,
          },
        },
      },
    });

    if (assignedSalesRepId) {
      void createNotification(assignedSalesRepId, NotificationType.LEAD_ASSIGNED);
    }
  } catch (err) {
    console.error("[crm] Falha ao sincronizar lead a partir de interesse em curso:", err);
  }
}

/**
 * Médico já logado (perfil já existe) demonstra interesse num curso que ainda
 * não comprou — pela "mini landing page" dentro do próprio portal. Diferente
 * de `upsertLeadFromCourseInterest` (público, pode criar conta nova), aqui só
 * atualiza o contato que já existe: marca o curso de interesse e registra no
 * histórico, sem criar pedido nenhum — a matrícula em si continua manual, via
 * CRM (Contatos → Matrícula Concluída), igual o caminho da landing pública.
 */
export async function expressCourseInterestAsExistingDoctor(
  doctorProfileId: string,
  catalogItemId: string,
  courseTitle: string,
): Promise<void> {
  await prisma.doctorProfile.update({
    where: { id: doctorProfileId },
    data: { courseOfInterestId: catalogItemId },
  });
  await prisma.leadActivity.create({
    data: {
      doctorProfileId,
      type: "NOTE",
      note: `Demonstrou interesse por um novo curso pelo portal: ${courseTitle}.`,
    },
  });
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

/**
 * Contas nascidas de landing page/CRM não têm senha conhecida — o comercial usa
 * isso pra gerar o link de "definir senha" e mandar manualmente pelo WhatsApp
 * junto com a confirmação da matrícula (ver [[project-phase5-status]]).
 */
export async function getPasswordSetupLink(actor: Actor, leadId: string): Promise<string> {
  const lead = await assertLeadAccess(actor, leadId);
  return createPasswordSetupLink(lead.userId);
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
