export type ContractPdfFields = {
  nomeCompleto: string;
  cpf: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  estadoCivil: string;
  profissao: string;
  email: string;
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

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Gera um PDF simples (sem dependências) com os dados do contrato. É um
 * placeholder até o contrato real (com timbre, via Google Docs) ser plugado —
 * ver PENDÊNCIAS.md. Já é suficiente para testar o fluxo Autentique ponta a ponta.
 */
export function generateContractPdf(fields: ContractPdfFields): Buffer {
  const lines = [
    "CONTRATO DE PRESTACAO DE SERVICOS (RASCUNHO)",
    "",
    `Curso: ${fields.eventoCidade} - ${fields.eventoDatas}`,
    `Coordenador: ${fields.coordenadorNome}`,
    "",
    "-- CONTRATANTE --",
    `Nome completo: ${fields.nomeCompleto}`,
    `CPF: ${fields.cpf}`,
    `Endereco: ${fields.endereco}, no ${fields.numero}`,
    `Bairro: ${fields.bairro}`,
    `Cidade/Estado: ${fields.cidade}/${fields.estado}`,
    `CEP: ${fields.cep}`,
    `Estado civil: ${fields.estadoCivil}`,
    `Profissao: ${fields.profissao}`,
    `E-mail: ${fields.email}`,
  ];

  const contentLines = lines
    .map((line, i) => `${i === 0 ? "50 750 Td" : "0 -18 Td"} (${escapePdfText(line)}) Tj`)
    .join("\n");
  const content = `BT /F1 12 Tf\n${contentLines}\nET`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
