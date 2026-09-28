import { writeFile } from "node:fs/promises";
import { generateContractPdf } from "../src/lib/contract-pdf.js";

const buf = await generateContractPdf({
  nomeCompleto: "Maria da Silva Teste",
  cpf: "123.456.789-00",
  endereco: "Rua das Flores",
  numero: "42",
  bairro: "Centro",
  cidade: "Florianópolis",
  estado: "SC",
  cep: "88000-000",
  estadoCivil: "Casada",
  profissao: "Dentista",
  email: "maria.teste@example.com",
  coordenadorNome: "Felipe Testando",
  coordenadorCpf: "987.654.321-00",
  coordenadorEndereco: "Av. Central",
  coordenadorNumero: "100",
  coordenadorBairro: "Jardins",
  coordenadorCidade: "São Paulo",
  coordenadorEstado: "SP",
  coordenadorCep: "01000-000",
  coordenadorEstadoCivil: "Solteiro(a)",
  coordenadorProfissao: "Médico",
  coordenadorEmail: "felipe@example.com",
  eventoCidade: "Orlando",
  eventoDatas: "11, 12 e 13 de novembro de 2026",
});

await writeFile(new URL("../assets/teste-overlay.pdf", import.meta.url), buf);
console.log("done", buf.length, "bytes");
