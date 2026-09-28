import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { env } from "../../config/env.js";
import { updateContractStatusByAutentiqueId } from "./contracts.service.js";

type AutentiqueWebhookPayload = {
  event?: {
    type: string;
    data: {
      document: string;
      signed: string | null;
      rejected: string | null;
    };
  };
};

function isValidSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!env.AUTENTIQUE_WEBHOOK_SECRET) return true; // segredo ainda não configurado — ver SETUP.
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", env.AUTENTIQUE_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const gotBuf = Buffer.from(signatureHeader, "utf8");
  if (expectedBuf.length !== gotBuf.length) return false;
  return timingSafeEqual(expectedBuf, gotBuf);
}

export async function handleAutentiqueWebhook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawBody = (req as FastifyRequest & { rawBody?: Buffer }).rawBody ?? Buffer.from("");
  const signature = req.headers["x-autentique-signature"] as string | undefined;

  if (!isValidSignature(rawBody, signature)) {
    reply.status(401).send("Assinatura inválida");
    return;
  }

  const payload = req.body as AutentiqueWebhookPayload;
  const { type, data } = payload.event ?? {};

  if (data?.document) {
    if (type === "signature.accepted" && data.signed) {
      await updateContractStatusByAutentiqueId(data.document, { status: "SIGNED", signedAt: new Date(data.signed) });
    } else if (type === "signature.rejected" && data.rejected) {
      await updateContractStatusByAutentiqueId(data.document, { status: "REFUSED" });
    }
  }

  reply.status(200).send("ok");
}
