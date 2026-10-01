/**
 * Camada de API — Contratos (assinatura digital via Autentique).
 * Contrato: backend/src/modules/contracts/
 */

import { apiFetch } from "./client";

export type ContractStatus = "PENDING" | "SIGNED" | "REFUSED";

export type ContractResponse = {
  id: string;
  nomeCompleto: string;
  email: string;
  status: ContractStatus;
  signUrl: string | null;
  createdAt: string;
  signedAt: string | null;
  turmaId: string;
  turmaLabel: string;
  coordenadorNome: string;
};

export type SubmitContractPayload = {
  nomeCompleto: string;
  email: string;
  cpf: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  estadoCivil: string;
  profissao: string;
};

export type CourseConfigPayload = {
  label: string;
  coordenadorNome: string;
  coordenadorCpf: string;
  coordenadorEndereco: string;
  coordenadorNumero: string;
  coordenadorBairro: string;
  coordenadorCidade: string;
  coordenadorEstado: string;
  coordenadorCep: string;
  coordenadorEstadoCivil: string;
  coordenadorProfissao: string;
  coordenadorEmail: string;
  eventoCidade: string;
  eventoDatas: string;
};

export type CourseConfigResponse = CourseConfigPayload & { id: string; slug: string; createdAt: string };

/** POST /api/public/contracts/:slug — formulário público, sem login */
export async function apiSubmitContract(
  slug: string,
  payload: SubmitContractPayload,
): Promise<{ status: ContractStatus; signUrl: string | null }> {
  return apiFetch(`/api/public/contracts/${encodeURIComponent(slug)}`, {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

/** GET /api/contracts — staff (SALES_REP, MANAGER, ADMIN) */
export async function apiListContracts(): Promise<ContractResponse[]> {
  return apiFetch<ContractResponse[]>("/api/contracts");
}

/** GET /api/contracts/config — lista todas as turmas cadastradas */
export async function apiListCourseConfigs(): Promise<CourseConfigResponse[]> {
  return apiFetch<CourseConfigResponse[]>("/api/contracts/config");
}

/** POST /api/contracts/config — MANAGER/ADMIN cadastra uma nova turma (coordenador + evento) */
export async function apiSaveCourseConfig(payload: CourseConfigPayload): Promise<CourseConfigResponse> {
  return apiFetch<CourseConfigResponse>("/api/contracts/config", { method: "POST", body: JSON.stringify(payload) });
}

/** PATCH /api/contracts/config/:id — edita uma turma existente (o link/slug não muda) */
export async function apiUpdateCourseConfig(id: string, payload: CourseConfigPayload): Promise<CourseConfigResponse> {
  return apiFetch<CourseConfigResponse>(`/api/contracts/config/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** DELETE /api/contracts/config/:id — só funciona se a turma ainda não tiver contratos */
export async function apiDeleteCourseConfig(id: string): Promise<void> {
  await apiFetch<void>(`/api/contracts/config/${id}`, { method: "DELETE" });
}
