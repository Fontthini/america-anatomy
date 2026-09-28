import type { Contract, ContractCourseConfig } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createDocumentFromPdf, getSignatureLink, getDocument, documentStatus } from "../../lib/autentique.js";
import { generateContractPdf } from "../../lib/contract-pdf.js";
import type { SubmitContractInput, CourseConfigInput, ContractResponse, CourseConfigResponse } from "./contracts.schemas.js";

function toContractResponse(c: Contract): ContractResponse {
  return {
    id: c.id,
    nomeCompleto: c.nomeCompleto,
    email: c.email,
    status: c.status,
    signUrl: c.signUrl,
    createdAt: c.createdAt.toISOString(),
    signedAt: c.signedAt ? c.signedAt.toISOString() : null,
  };
}

function toConfigResponse(c: ContractCourseConfig): CourseConfigResponse {
  return {
    id: c.id,
    label: c.label,
    coordenadorNome: c.coordenadorNome,
    coordenadorCpf: c.coordenadorCpf,
    coordenadorEndereco: c.coordenadorEndereco,
    coordenadorNumero: c.coordenadorNumero,
    coordenadorBairro: c.coordenadorBairro,
    coordenadorCidade: c.coordenadorCidade,
    coordenadorEstado: c.coordenadorEstado,
    coordenadorCep: c.coordenadorCep,
    coordenadorEstadoCivil: c.coordenadorEstadoCivil,
    coordenadorProfissao: c.coordenadorProfissao,
    coordenadorEmail: c.coordenadorEmail,
    eventoCidade: c.eventoCidade,
    eventoDatas: c.eventoDatas,
    createdAt: c.createdAt.toISOString(),
  };
}

/** A "turma atual" é sempre o cadastro de coordenador/evento mais recente. */
export async function getActiveCourseConfig(): Promise<ContractCourseConfig> {
  const config = await prisma.contractCourseConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!config) {
    throw new AppError(
      400,
      "NO_ACTIVE_COURSE",
      "Nenhuma turma configurada ainda. Cadastre o coordenador/evento atual primeiro.",
    );
  }
  return config;
}

export async function getActiveCourseConfigResponse(): Promise<CourseConfigResponse | null> {
  const config = await prisma.contractCourseConfig.findFirst({ orderBy: { createdAt: "desc" } });
  return config ? toConfigResponse(config) : null;
}

export async function saveCourseConfig(
  input: CourseConfigInput,
  createdByUserId: string,
): Promise<CourseConfigResponse> {
  const config = await prisma.contractCourseConfig.create({ data: { ...input, createdByUserId } });
  return toConfigResponse(config);
}

export async function submitContract(input: SubmitContractInput): Promise<{
  status: ContractResponse["status"];
  signUrl: string | null;
}> {
  const config = await getActiveCourseConfig();

  const pdfBuffer = await generateContractPdf({ ...input, ...config });

  const doc = await createDocumentFromPdf({
    name: `Contrato - ${input.nomeCompleto}`,
    pdfBuffer,
    signerName: input.nomeCompleto,
    signerEmail: input.email,
  });

  const signature = doc.signatures[0];
  const signUrl = signature ? await getSignatureLink(signature.public_id) : null;
  const status = documentStatus(doc);

  await prisma.contract.create({
    data: {
      configId: config.id,
      nomeCompleto: input.nomeCompleto,
      email: input.email,
      cpf: input.cpf,
      endereco: input.endereco,
      numero: input.numero,
      bairro: input.bairro,
      cidade: input.cidade,
      estado: input.estado,
      cep: input.cep,
      estadoCivil: input.estadoCivil,
      profissao: input.profissao,
      status,
      autentiqueDocumentId: doc.id,
      signUrl,
    },
  });

  return { status, signUrl };
}

/**
 * Sincroniza os contratos ainda "pendentes" com o status real no Autentique.
 * Existe porque o webhook (painel.autentique.com.br/perfil/webhooks) pode não
 * estar configurado ainda — sem isso, o status nunca atualizava sozinho.
 * Fica limitado aos 30 mais recentes pendentes pra não estourar rate limit.
 */
async function syncPendingContracts(rows: Contract[]): Promise<Contract[]> {
  const pending = rows.filter((r) => r.status === "PENDING" && r.autentiqueDocumentId).slice(0, 30);
  if (pending.length === 0) return rows;

  const updates = await Promise.all(
    pending.map(async (row) => {
      const doc = await getDocument(row.autentiqueDocumentId!);
      if (!doc) return null;
      const status = documentStatus(doc);
      if (status === "PENDING") return null;
      const signedAt = doc.signatures[0]?.signed?.created_at;
      return { id: row.id, status, signedAt: signedAt ? new Date(signedAt) : undefined };
    }),
  );

  const changed = updates.filter((u): u is NonNullable<typeof u> => u !== null);
  if (changed.length === 0) return rows;

  await Promise.all(
    changed.map((u) =>
      prisma.contract.update({ where: { id: u.id }, data: { status: u.status, signedAt: u.signedAt } }),
    ),
  );

  const byId = new Map(changed.map((u) => [u.id, u]));
  return rows.map((r) => {
    const u = byId.get(r.id);
    return u ? { ...r, status: u.status, signedAt: u.signedAt ?? r.signedAt } : r;
  });
}

export async function listContracts(): Promise<ContractResponse[]> {
  const rows = await prisma.contract.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const synced = await syncPendingContracts(rows);
  return synced.map(toContractResponse);
}

export async function updateContractStatusByAutentiqueId(
  autentiqueDocumentId: string,
  update: { status: "SIGNED" | "REFUSED"; signedAt?: Date },
): Promise<void> {
  await prisma.contract.updateMany({
    where: { autentiqueDocumentId },
    data: update,
  });
}
