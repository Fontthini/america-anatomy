import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createAuditLog } from "../../lib/audit-log.js";
import { recordAutoFinancialEntry } from "../finance/finance.service.js";
import type { CreateReferralInput, ListReferralsQuery, ReferralResponse } from "./referrals.schemas.js";
import type { Referral, DoctorProfile, User, ReferralPatientStatus, ReferralDoctorStatus, Prisma } from "@prisma/client";

type Actor = { id: string; name: string; role: string };

function toReferralResponse(referral: Referral & { referringDoctorProfile: DoctorProfile & { user: User } }): ReferralResponse {
  return {
    id: referral.id,
    referringDoctorProfileId: referral.referringDoctorProfileId,
    referringDoctorName: referral.referringDoctorProfile.user.name,
    type: referral.type,
    firstName: referral.firstName,
    lastName: referral.lastName,
    whatsapp: referral.whatsapp,
    email: referral.email,
    address: referral.address,
    crm: referral.crm,
    patientStatus: referral.patientStatus,
    doctorStatus: referral.doctorStatus,
    notes: referral.notes,
    commissionAmount: referral.commissionAmount ? referral.commissionAmount.toString() : null,
    commissionPaid: referral.commissionPaid,
    createdAt: referral.createdAt.toISOString(),
  };
}

export async function createReferral(doctorUserId: string, input: CreateReferralInput): Promise<ReferralResponse> {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
  if (!profile) {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Perfil de médico não encontrado.");
  }

  const referral = await prisma.referral.create({
    data: {
      referringDoctorProfileId: profile.id,
      type: input.type,
      firstName: input.firstName,
      lastName: input.lastName,
      whatsapp: input.whatsapp,
      email: input.email,
      address: input.address,
      notes: input.notes,
      ...(input.type === "DOCTOR"
        ? { crm: input.crm, doctorStatus: "NEW" }
        : { patientStatus: "IN_PROGRESS" }),
    },
    include: { referringDoctorProfile: { include: { user: true } } },
  });

  return toReferralResponse(referral);
}

export async function listMyReferrals(doctorUserId: string): Promise<ReferralResponse[]> {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
  if (!profile) {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Perfil de médico não encontrado.");
  }
  const referrals = await prisma.referral.findMany({
    where: { referringDoctorProfileId: profile.id },
    include: { referringDoctorProfile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return referrals.map(toReferralResponse);
}

/** Vendedor só vê indicações de médicos atribuídos a ele — gerente/admin veem tudo. */
export async function listReferrals(actor: Actor, query: ListReferralsQuery): Promise<ReferralResponse[]> {
  const referrals = await prisma.referral.findMany({
    where: {
      ...(query.type ? { type: query.type } : {}),
      ...(actor.role === "SALES_REP" ? { referringDoctorProfile: { assignedSalesRepId: actor.id } } : {}),
    },
    include: { referringDoctorProfile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return referrals.map(toReferralResponse);
}

async function findReferralOrThrow(
  id: string,
): Promise<Referral & { referringDoctorProfile: DoctorProfile & { user: User } }> {
  const referral = await prisma.referral.findUnique({
    where: { id },
    include: { referringDoctorProfile: { include: { user: true } } },
  });
  if (!referral) {
    throw new AppError(404, "REFERRAL_NOT_FOUND", "Indicação não encontrada.");
  }
  return referral;
}

const PATIENT_STATUSES: ReferralPatientStatus[] = ["IN_PROGRESS", "NEGOTIATION", "PAID", "CANCELLED"];
const DOCTOR_STATUSES: ReferralDoctorStatus[] = ["NEW", "CONTACTED", "CONVERTED", "REJECTED"];

export async function updateReferralStatus(
  actor: Actor,
  id: string,
  status: string,
): Promise<ReferralResponse> {
  const existing = await findReferralOrThrow(id);
  if (actor.role === "SALES_REP" && existing.referringDoctorProfile.assignedSalesRepId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "Você só pode atualizar indicações de médicos atribuídos a você.");
  }

  const validStatuses: string[] = existing.type === "PATIENT" ? PATIENT_STATUSES : DOCTOR_STATUSES;
  if (!validStatuses.includes(status)) {
    throw new AppError(400, "VALIDATION_ERROR", `Status inválido para indicação do tipo ${existing.type}.`);
  }

  const data: Prisma.ReferralUpdateInput =
    existing.type === "PATIENT"
      ? { patientStatus: status as ReferralPatientStatus }
      : { doctorStatus: status as ReferralDoctorStatus };

  const updated = await prisma.referral.update({
    where: { id },
    data,
    include: { referringDoctorProfile: { include: { user: true } } },
  });

  void createAuditLog(actor, "REFERRAL_STATUS_UPDATED", `${updated.firstName} ${updated.lastName} → ${status}`);
  return toReferralResponse(updated);
}

/** Comissão manual, lançamento único (409 se já paga) — gera automaticamente uma saída no financeiro. */
export async function launchCommission(actor: Actor, id: string, amount: number): Promise<ReferralResponse> {
  const existing = await findReferralOrThrow(id);
  if (existing.commissionPaid) {
    throw new AppError(409, "COMMISSION_ALREADY_PAID", "A comissão desta indicação já foi lançada.");
  }

  const updated = await prisma.referral.update({
    where: { id },
    data: { commissionAmount: amount, commissionPaid: true },
    include: { referringDoctorProfile: { include: { user: true } } },
  });

  void recordAutoFinancialEntry({
    type: "EXPENSE",
    category: "Comissão",
    description: `Comissão — indicação de ${updated.firstName} ${updated.lastName} por Dr(a). ${updated.referringDoctorProfile.user.name}`,
    amount,
  });
  void createAuditLog(actor, "COMMISSION_LAUNCHED", `R$ ${amount} — ${updated.referringDoctorProfile.user.name}`);

  return toReferralResponse(updated);
}
