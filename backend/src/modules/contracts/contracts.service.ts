import type { Contract, ContractCourseConfig } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createDocumentFromPdf, getSignatureLink, getDocument, documentStatus } from "../../lib/autentique.js";
import { generateContractPdf } from "../../lib/contract-pdf.js";
import { sendEmail } from "../../lib/email/send.js";
import { contractSignTemplate } from "../../lib/email/templates.js";
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
    slug: c.slug,
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

function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Busca a turma pelo slug do link público (/contrato/:slug). */
export async function getCourseConfigBySlug(slug: string): Promise<ContractCourseConfig> {
  const config = await prisma.contractCourseConfig.findUnique({ where: { slug } });
  if (!config) {
    throw new AppError(404, "COURSE_NOT_FOUND", "Link de turma inválido ou não encontrado.");
  }
  return config;
}

export async function listCourseConfigs(): Promise<CourseConfigResponse[]> {
  const configs = await prisma.contractCourseConfig.findMany({ orderBy: { createdAt: "desc" } });
  return configs.map(toConfigResponse);
}

export async function saveCourseConfig(
  input: CourseConfigInput,
  createdByUserId: string,
): Promise<CourseConfigResponse> {
  const base = slugify(input.label);
  if (!base) {
    throw new AppError(400, "INVALID_LABEL", "Nome da turma precisa ter ao menos uma letra ou número.");
  }

  // Tenta o slug "limpo" primeiro; se já existir (duas turmas com nome
  // parecido), acrescenta um sufixo curto até achar um livre.
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const exists = await prisma.contractCourseConfig.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) {
      const config = await prisma.contractCourseConfig.create({ data: { ...input, slug, createdByUserId } });
      return toConfigResponse(config);
    }
  }
  throw new AppError(409, "SLUG_CONFLICT", "Não foi possível gerar um link único para essa turma, tente outro nome.");
}

export async function submitContract(
  slug: string,
  input: SubmitContractInput,
): Promise<{
  status: ContractResponse["status"];
  signUrl: string | null;
}> {
  const config = await getCourseConfigBySlug(slug);

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

  // Não depende do e-mail automático do Autentique (a conta usada aqui não
  // dispara — ver contractSignTemplate). Best-effort: se falhar, o contrato
  // já foi criado e o link continua disponível na tela de confirmação.
  if (signUrl) {
    await sendEmail({ to: input.email, ...contractSignTemplate({ name: input.nomeCompleto, signUrl }) });
  }

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
