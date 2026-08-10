import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { hashPassword } from "../../lib/hash.js";
import { sendEmail } from "../../lib/email/send.js";
import {
  doctorPendingApprovalTemplate,
  doctorApprovedTemplate,
  doctorRejectedTemplate,
} from "../../lib/email/templates.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import { issueTokens, persistRefreshToken, toUserResponse } from "../auth/auth.service.js";
import type { AuthResponse } from "../auth/auth.schemas.js";
import type { DoctorRegisterInput, RejectDoctorInput, DoctorProfileResponse } from "./doctors.schemas.js";
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

  void sendEmail({ to: user.email, ...doctorPendingApprovalTemplate({ name: user.name }) });

  const { accessToken, refreshToken } = issueTokens(user);
  await persistRefreshToken(user.id, refreshToken);

  void createNotification(user.id, NotificationType.DOCTOR_REGISTRATION_RECEIVED);
  void notifyStaffOfNewDoctor();

  return { user: toUserResponse(user), token: accessToken, refreshToken };
}

async function notifyStaffOfNewDoctor(): Promise<void> {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
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

async function findProfileByUserIdOrThrow(
  doctorUserId: string,
): Promise<DoctorProfile & { user: User }> {
  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    include: { user: true },
  });
  if (!profile) {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Perfil de médico não encontrado.");
  }
  return profile;
}

export async function approveDoctor(
  adminUserId: string,
  doctorUserId: string,
): Promise<DoctorProfileResponse> {
  const profile = await findProfileByUserIdOrThrow(doctorUserId);

  const updated = await prisma.doctorProfile.update({
    where: { id: profile.id },
    data: {
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      approvedByUserId: adminUserId,
      rejectedAt: null,
      rejectionReason: null,
    },
    include: { user: true },
  });

  void sendEmail({ to: updated.user.email, ...doctorApprovedTemplate({ name: updated.user.name }) });
  void createNotification(updated.userId, NotificationType.DOCTOR_APPROVED);

  return toDoctorProfileResponse(updated);
}

export async function rejectDoctor(
  doctorUserId: string,
  input: RejectDoctorInput,
): Promise<DoctorProfileResponse> {
  const profile = await findProfileByUserIdOrThrow(doctorUserId);

  const updated = await prisma.doctorProfile.update({
    where: { id: profile.id },
    data: {
      approvalStatus: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: input.reason ?? null,
    },
    include: { user: true },
  });

  void sendEmail({
    to: updated.user.email,
    ...doctorRejectedTemplate({ name: updated.user.name, ...(input.reason ? { reason: input.reason } : {}) }),
  });
  void createNotification(updated.userId, NotificationType.DOCTOR_REJECTED);

  return toDoctorProfileResponse(updated);
}
