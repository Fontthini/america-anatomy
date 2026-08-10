/**
 * Funções de API de indicações (paciente/médico) e comissão.
 * Contrato: backend/docs/api-contract.md — seção Indicações (/api/referrals/)
 */

import { apiFetch } from "./client";

export type ReferralType = "PATIENT" | "DOCTOR";
export type ReferralPatientStatus = "IN_PROGRESS" | "NEGOTIATION" | "PAID" | "CANCELLED";
export type ReferralDoctorStatus = "NEW" | "CONTACTED" | "CONVERTED" | "REJECTED";

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

export type CreateReferralPayload =
  | { type: "PATIENT"; firstName: string; lastName: string; whatsapp: string; email?: string; address?: string; notes?: string }
  | { type: "DOCTOR"; firstName: string; lastName: string; whatsapp: string; email?: string; address?: string; notes?: string; crm: string };

/** POST /api/referrals — médico autenticado indica paciente ou médico. */
export async function apiCreateReferral(payload: CreateReferralPayload): Promise<ReferralResponse> {
  return apiFetch<ReferralResponse>("/api/referrals", { method: "POST", body: JSON.stringify(payload) });
}

/** GET /api/referrals/me */
export async function apiListMyReferrals(): Promise<ReferralResponse[]> {
  return apiFetch<ReferralResponse[]>("/api/referrals/me");
}

/** GET /api/referrals?type= — staff */
export async function apiListReferrals(type?: ReferralType): Promise<ReferralResponse[]> {
  const qs = type ? `?type=${type}` : "";
  return apiFetch<ReferralResponse[]>(`/api/referrals${qs}`);
}

/** PATCH /api/referrals/:id/status */
export async function apiUpdateReferralStatus(id: string, status: string): Promise<ReferralResponse> {
  return apiFetch<ReferralResponse>(`/api/referrals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/** PUT /api/referrals/:id/commission — MANAGER/ADMIN, lançamento único */
export async function apiLaunchCommission(id: string, amount: number): Promise<ReferralResponse> {
  return apiFetch<ReferralResponse>(`/api/referrals/${id}/commission`, {
    method: "PUT",
    body: JSON.stringify({ amount }),
  });
}
