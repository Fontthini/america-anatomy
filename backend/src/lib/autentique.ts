import { env } from "../config/env.js";
import { AppError } from "../middlewares/error-handler.js";

const AUTENTIQUE_URL = "https://api.autentique.com.br/v2/graphql";

function getToken(): string {
  if (!env.AUTENTIQUE_API_TOKEN) {
    throw new AppError(500, "AUTENTIQUE_NOT_CONFIGURED", "AUTENTIQUE_API_TOKEN não configurado.");
  }
  return env.AUTENTIQUE_API_TOKEN;
}

export type AutentiqueSignature = {
  public_id: string;
  name: string;
  email: string;
  created_at: string;
  link: { short_link: string } | null;
  signed: { created_at: string } | null;
  rejected: { created_at: string } | null;
};

export type AutentiqueDocument = {
  id: string;
  name: string;
  created_at: string;
  signatures: AutentiqueSignature[];
};

const CREATE_DOCUMENT_MUTATION = `
  mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
    createDocument(document: $document, signers: $signers, file: $file) {
      id
      name
      created_at
      signatures {
        public_id
        name
        email
        created_at
        link { short_link }
      }
    }
  }
`;

const CREATE_LINK_MUTATION = `
  mutation CreateLinkToSignature($publicId: UUID!) {
    createLinkToSignature(public_id: $publicId) {
      short_link
    }
  }
`;

/** Cria o documento no Autentique a partir de um PDF já gerado e retorna o documento criado. */
export async function createDocumentFromPdf(params: {
  name: string;
  pdfBuffer: Buffer;
  signerName: string;
  signerEmail: string;
}): Promise<AutentiqueDocument> {
  const operations = JSON.stringify({
    query: CREATE_DOCUMENT_MUTATION,
    variables: {
      document: { name: params.name },
      signers: [{ name: params.signerName, email: params.signerEmail, action: "SIGN" }],
      file: null,
    },
  });

  const form = new FormData();
  form.append("operations", operations);
  form.append("map", JSON.stringify({ file: ["variables.file"] }));
  form.append("file", new Blob([new Uint8Array(params.pdfBuffer)], { type: "application/pdf" }), "contrato.pdf");

  const res = await fetch(AUTENTIQUE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });

  const json = (await res.json()) as { data?: { createDocument: AutentiqueDocument }; errors?: unknown };
  if (!res.ok || json.errors) {
    throw new AppError(502, "AUTENTIQUE_CREATE_FAILED", "Falha ao criar documento no Autentique.", json.errors);
  }
  return json.data!.createDocument;
}

/**
 * Signatários por e-mail não recebem "link" na criação do documento (só quem
 * usa entrega por link). Geramos sob demanda pra sempre ter uma opção direta
 * além do e-mail automático que o Autentique dispara.
 */
export async function getSignatureLink(publicId: string): Promise<string | null> {
  try {
    const res = await fetch(AUTENTIQUE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: CREATE_LINK_MUTATION, variables: { publicId } }),
    });
    const json = (await res.json()) as {
      data?: { createLinkToSignature: { short_link: string } };
      errors?: unknown;
    };
    if (!res.ok || json.errors) return null;
    return json.data!.createLinkToSignature.short_link;
  } catch {
    return null;
  }
}

export type DocStatus = "PENDING" | "SIGNED" | "REFUSED";

export function documentStatus(doc: AutentiqueDocument): DocStatus {
  const sig = doc.signatures[0];
  if (!sig) return "PENDING";
  if (sig.signed) return "SIGNED";
  if (sig.rejected) return "REFUSED";
  return "PENDING";
}
