/**
 * Funções de API de médicos (cadastro + aprovação).
 * Contrato: backend/docs/api-contract.md — seção Médicos (/api/doctors/)
 */

import { apiFetch, setToken } from "./client";
import type { MockUser } from "../mock/users";

export type ApprovalStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

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

export type DoctorRegisterPayload = {
  name: string;
  email: string;
  password: string;
  crm?: string;
  specialty?: string;
  phone?: string;
  clinicName?: string;
  city?: string;
  state?: string;
};

/** POST /api/doctors/register — cria conta de médico e armazena o access token. */
export async function apiRegisterDoctor(payload: DoctorRegisterPayload): Promise<MockUser> {
  const data = await apiFetch<{ user: MockUser; token: string }>("/api/doctors/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  setToken(data.token);
  return data.user;
}

/** GET /api/doctors/me — perfil do médico autenticado, com status de aprovação. */
export async function apiGetMyDoctorProfile(): Promise<DoctorProfileResponse> {
  return apiFetch<DoctorProfileResponse>("/api/doctors/me");
}

/** GET /api/doctors?status= — staff/admin: lista médicos. */
export async function apiListDoctors(status?: ApprovalStatus): Promise<DoctorProfileResponse[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<DoctorProfileResponse[]>(`/api/doctors${qs}`);
}
