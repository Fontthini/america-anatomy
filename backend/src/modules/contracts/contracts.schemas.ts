import { z } from "zod";

/** Dados que o próprio paciente/aluno preenche no formulário público. */
export const submitContractSchema = z.object({
  nomeCompleto: z.string().min(3),
  email: z.string().email(),
  cpf: z.string().min(3),
  endereco: z.string().min(1),
  numero: z.string().min(1),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  estado: z.string().min(2).max(2),
  cep: z.string().min(1),
  estadoCivil: z.string().min(1),
  profissao: z.string().min(1),
});
export type SubmitContractInput = z.infer<typeof submitContractSchema>;

/** Dados fixos do coordenador/evento da turma atual — preenchidos pela equipe, não pelo paciente. */
export const courseConfigSchema = z.object({
  label: z.string().min(1),
  coordenadorNome: z.string().min(1),
  coordenadorCpf: z.string().min(1),
  coordenadorEndereco: z.string().min(1),
  coordenadorNumero: z.string().min(1),
  coordenadorBairro: z.string().min(1),
  coordenadorCidade: z.string().min(1),
  coordenadorEstado: z.string().min(2).max(2),
  coordenadorCep: z.string().min(1),
  coordenadorEstadoCivil: z.string().min(1),
  coordenadorProfissao: z.string().min(1),
  coordenadorEmail: z.string().email(),
  eventoCidade: z.string().min(1),
  eventoDatas: z.string().min(1),
});
export type CourseConfigInput = z.infer<typeof courseConfigSchema>;

export type ContractResponse = {
  id: string;
  nomeCompleto: string;
  email: string;
  status: "PENDING" | "SIGNED" | "REFUSED";
  signUrl: string | null;
  createdAt: string;
  signedAt: string | null;
  turmaId: string;
  turmaLabel: string;
  coordenadorNome: string;
};

export type CourseConfigResponse = CourseConfigInput & { id: string; slug: string; createdAt: string };
