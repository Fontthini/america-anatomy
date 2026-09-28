import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { hashPassword } from "../../lib/hash.js";
import { sendEmail } from "../../lib/email/send.js";
import { doctorPendingApprovalTemplate } from "../../lib/email/templates.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import { pickNextSalesRep } from "../crm/crm.service.js";
import { issueTokens, persistRefreshToken, toUserResponse } from "../auth/auth.service.js";
import type { AuthResponse } from "../auth/auth.schemas.js";
import type { DoctorRegisterInput, DoctorProfileResponse } from "./doctors.schemas.js";
import type { DoctorProfile, User, ApprovalStatus } from "@prisma/client";

function toDoctorProfileResponse(profile: DoctorProfile & { user: User }): DoctorProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    email: profile.user.email,
    crm: profile.crm,
    specialty: profile.specialty,
    phone: profile.phone,
    clinicName: profile.clinicName,
    city: profile.city,
    state: profile.state,
    approvalStatus: profile.approvalStatus,
    rejectionReason: profile.rejectionReason,
    createdAt: profile.createdAt.toISOString(),
  };
}

export async function registerDoctor(input: DoctorRegisterInput): Promise<AuthResponse> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Este e-mail já está em uso.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "DOCTOR",
      passwordHistory: { create: { passwordHash } },
      doctorProfile: {
        create: {
          crm: input.crm,
          specialty: input.specialty,
          phone: input.phone,
          clinicName: input.clinicName,
          city: input.city,
          state: input.state,
        },
      },
    },
  });

  // Serverless (Vercel): a função pode congelar assim que a resposta HTTP sai,
  // matando promises "fire-and-forget" ainda pendentes — por isso await, não `void`.
  await sendEmail({ to: user.email, ...doctorPendingApprovalTemplate({ name: user.name }) });

  // DoctorProfile recém-criado nasce PENDING (default do schema) — sem precisar reconsultar.
  const { accessToken, refreshToken } = issueTokens({ ...user, doctorApprovalStatus: "PENDING" });
  await persistRefreshToken(user.id, refreshToken);

  void createNotification(user.id, NotificationType.DOCTOR_REGISTRATION_RECEIVED);
  void notifyStaffOfNewDoctor();
  void assignRoundRobin(user.id);

  return { user: toUserResponse(user), token: accessToken, refreshToken };
}

/** Distribui o lead novo pro vendedor com menos leads no momento (best-effort, não bloqueia o cadastro). */
async function assignRoundRobin(doctorUserId: string): Promise<void> {
  try {
    const salesRepId = await pickNextSalesRep();
    if (!salesRepId) return;
    await prisma.doctorProfile.update({
      where: { userId: doctorUserId },
      data: { assignedSalesRepId: salesRepId },
    });
    void createNotification(salesRepId, NotificationType.LEAD_ASSIGNED);
  } catch (err) {
    console.error("[doctors] Falha ao atribuir vendedor via round-robin:", err);
  }
}

async function notifyStaffOfNewDoctor(): Promise<void> {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "ADMIN"] } },
    select: { id: true },
  });
  for (const member of staff) {
    void createNotification(member.id, NotificationType.NEW_DOCTOR_PENDING);
  }
}

export async function getMyDoctorProfile(userId: string): Promise<DoctorProfileResponse> {
  const profile = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!profile) {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Perfil de médico não encontrado.");
  }
  return toDoctorProfileResponse(profile);
}

export async function listDoctors(status?: ApprovalStatus): Promise<DoctorProfileResponse[]> {
  const profiles = await prisma.doctorProfile.findMany({
    where: status ? { approvalStatus: status } : {},
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return profiles.map(toDoctorProfileResponse);
}

/**
 * Apaga o médico de verdade (User + DoctorProfile), não é rejeitar. Tudo que
 * pende do User/DoctorProfile sai em cascata pelo schema (LeadActivity,
 * LeadReminder, Referral, Order, RefreshToken, PasswordHistory, Notification,
 * VerificationToken); AuditLog.actorUserId e CatalogItem.instructorUserId só
 * ficam null (SET NULL de propósito, não bloqueiam a exclusão).
 */
export async function deleteDoctor(doctorUserId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: doctorUserId } });
  if (!user || user.role !== "DOCTOR") {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Médico não encontrado.");
  }
  await prisma.user.delete({ where: { id: doctorUserId } });
}
