import type { Contract, ContractCourseConfig } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createDocumentFromPdf, getSignatureLink, documentStatus } from "../../lib/autentique.js";
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

  const pdfBuffer = generateContractPdf({ ...input, ...config });

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

export async function listContracts(): Promise<ContractResponse[]> {
  const rows = await prisma.contract.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return rows.map(toContractResponse);
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
