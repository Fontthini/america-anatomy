import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CONTRATO_MODELO_BASE64 } from "./contrato-modelo-base64.js";

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

const FONT_SIZE = 11;
const LINE_HEIGHT = 14.5;
const LEFT_MARGIN = 34;
const RIGHT_EDGE = 562;

/** Quebra um texto em linhas que cabem em `maxWidth`, usando a largura real da fonte. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Apaga uma região (retângulo branco) e escreve um texto novo, quebrando linha sozinho. */
function replaceRegion(
  page: PDFPage,
  font: PDFFont,
  text: string,
  region: { top: number; bottom: number; left?: number; right?: number },
): void {
  const left = region.left ?? LEFT_MARGIN;
  const right = region.right ?? RIGHT_EDGE;

  page.drawRectangle({
    x: left - 2,
    y: region.bottom,
    width: right - left + 4,
    height: region.top - region.bottom,
    color: rgb(1, 1, 1),
  });

  const lines = wrapText(text, font, FONT_SIZE, right - left);
  let y = region.top - FONT_SIZE;
  for (const line of lines) {
    page.drawText(line, { x: left, y, size: FONT_SIZE, font, color: rgb(0, 0, 0) });
    y -= LINE_HEIGHT;
  }
}

/**
 * Preenche o contrato original (com timbre) sobrepondo texto novo por cima
 * dos 3 trechos que mudam por aluno/turma — nome do coordenador, dados do
 * contratante e a definição do evento. O resto do PDF (cláusulas, timbre,
 * assinatura da CONTRATADA) fica intacto.
 */
export async function generateContractPdf(fields: ContractPdfFields): Promise<Buffer> {
  const templateBytes = Buffer.from(CONTRATO_MODELO_BASE64, "base64");
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const lastPage = pages[pages.length - 1];
  if (!page || !lastPage) throw new Error("Modelo de contrato sem páginas");

  replaceRegion(
    page,
    font,
    `COORDENADOR PEDAGÓGICO E CIENTÍFICO: ${fields.coordenadorNome}, inscrito no CPF nº ${fields.coordenadorCpf}, residente à ${fields.coordenadorEndereco}, nº ${fields.coordenadorNumero}, BAIRRO ${fields.coordenadorBairro}, ${fields.coordenadorCidade}, ${fields.coordenadorEstado}, ${fields.coordenadorCep}, ESTADO CIVIL ${fields.coordenadorEstadoCivil}, PROFISSÃO ${fields.coordenadorProfissao}, ENDEREÇO DE E-MAIL ${fields.coordenadorEmail}`,
    { top: 518, bottom: 430 },
  );

  replaceRegion(
    page,
    font,
    `CONTRATANTE: ${fields.nomeCompleto}, inscrito no CPF sob nº ${fields.cpf}, residente à ${fields.endereco}, nº ${fields.numero}, BAIRRO ${fields.bairro}, CIDADE ${fields.cidade}, ESTADO ${fields.estado}, CEP ${fields.cep}, ESTADO CIVIL ${fields.estadoCivil}, PROFISSÃO ${fields.profissao}, ENDEREÇO DE E-MAIL ${fields.email}`,
    { top: 407, bottom: 316 },
  );

  replaceRegion(
    page,
    font,
    `01- DEFINIÇÃO EVENTO: A Professora ${fields.coordenadorNome} atuará como Coordenadora Pedagógica e Científica do evento. O curso será realizado nos dias ${fields.eventoDatas}, na cidade de ${fields.eventoCidade}, nas instalações do American Anatomy Institute, podendo o endereço completo ser informado previamente aos participantes.`,
    { top: 296, bottom: 168 },
  );

  const closingLine = `${fields.eventoCidade}, ${fields.eventoDatas}.`;
  const closingWidth = font.widthOfTextAtSize(closingLine, FONT_SIZE);
  lastPage.drawRectangle({ x: 150, y: 703, width: 300, height: 18, color: rgb(1, 1, 1) });
  lastPage.drawText(closingLine, {
    x: (596 - closingWidth) / 2,
    y: 708,
    size: FONT_SIZE,
    font,
    color: rgb(0, 0, 0),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
