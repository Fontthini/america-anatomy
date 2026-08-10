import { z } from "zod";
import type { ApprovalStatus } from "@prisma/client";

export const doctorRegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(100),
  email: z.string().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres.").max(128),
  crm: z.string().max(30).optional(),
  specialty: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  clinicName: z.string().max(150).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
});

export const rejectDoctorSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listDoctorsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export type DoctorRegisterInput = z.infer<typeof doctorRegisterSchema>;
export type RejectDoctorInput = z.infer<typeof rejectDoctorSchema>;
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

export type DoctorProfileResponse = {
  id: string;
  userId: string;
  name: string;
  email: string;
  crm: string | null;
  specialty: string | null;
  phone: string | null;
  clinicName: string | null;
  city: string | null;
  state: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  createdAt: string;
};
