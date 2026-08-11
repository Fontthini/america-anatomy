/**
 * Funções de API do Programa de Embaixadores.
 * Contrato: backend/docs/api-contract.md — seção Embaixadores (/api/ambassadors/)
 */

import { apiFetch } from "./client";

export type AmbassadorApplicationStatus = "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";

export type AmbassadorApplicationResponse = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  profileType: string;
  alreadyKnowsAai: boolean;
  availableForLives: boolean;
  hasNetwork: boolean;
  notes: string | null;
  status: AmbassadorApplicationStatus;
  createdAt: string;
};

export type AmbassadorApplicationPayload = {
  name: string;
  email: string;
  whatsapp: string;
  profileType: string;
  alreadyKnowsAai: boolean;
  availableForLives: boolean;
  hasNetwork: boolean;
  notes?: string;
};

/** POST /api/ambassadors/apply — sem login */
export async function apiApplyAsAmbassador(payload: AmbassadorApplicationPayload): Promise<AmbassadorApplicationResponse> {
  return apiFetch<AmbassadorApplicationResponse>("/api/ambassadors/apply", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

/** GET /api/ambassadors — staff/admin */
export async function apiListAmbassadorApplications(): Promise<AmbassadorApplicationResponse[]> {
  return apiFetch<AmbassadorApplicationResponse[]>("/api/ambassadors");
}

/** PATCH /api/ambassadors/:id/status — staff/admin */
export async function apiUpdateAmbassadorApplicationStatus(
  id: string,
  status: AmbassadorApplicationStatus,
): Promise<AmbassadorApplicationResponse> {
  return apiFetch<AmbassadorApplicationResponse>(`/api/ambassadors/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
