import { z } from "zod";
import type { ReferralType, ReferralPatientStatus, ReferralDoctorStatus } from "@prisma/client";

const baseReferralFields = {
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(1).max(100),
  whatsapp: z.string().min(8).max(30),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
};

export const createReferralSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("PATIENT"), ...baseReferralFields }),
  z.object({ type: z.literal("DOCTOR"), ...baseReferralFields, crm: z.string().min(1).max(30) }),
]);

export const listReferralsQuerySchema = z.object({
  type: z.enum(["PATIENT", "DOCTOR"]).optional(),
});

export const updateReferralStatusSchema = z.object({
  status: z.string().min(1).max(30),
});

export const launchCommissionSchema = z.object({
  amount: z.number().positive(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type ListReferralsQuery = z.infer<typeof listReferralsQuerySchema>;
export type LaunchCommissionInput = z.infer<typeof launchCommissionSchema>;

export type ReferralResponse = {
  id: string;
  referringDoctorProfileId: string;
  referringDoctorName: string;
  type: ReferralType;
  firstName: string;
  lastName: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  crm: string | null;
  patientStatus: ReferralPatientStatus | null;
  doctorStatus: ReferralDoctorStatus | null;
  notes: string | null;
  commissionAmount: string | null;
  commissionPaid: boolean;
  createdAt: string;
};
