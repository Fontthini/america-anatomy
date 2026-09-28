import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import {
  handleSubmitContract,
  handleListContracts,
  handleGetCourseConfig,
  handleSaveCourseConfig,
} from "./contracts.controller.js";
import { handleAutentiqueWebhook } from "./contracts.webhook.js";

export async function contractsRoutes(app: FastifyInstance): Promise<void> {
  // Formulário público — o paciente/aluno preenche sozinho, sem login, a partir do link que a equipe manda.
  app.post("/api/public/contracts", handleSubmitContract);

  // Staff (CRM) acompanha os contratos gerados e configura o coordenador/evento da turma atual.
  const staff = { preHandler: [authenticate, requireRole("SALES_REP", "MANAGER", "ADMIN")] };
  app.get("/api/contracts", staff, handleListContracts);
  app.get("/api/contracts/config", staff, handleGetCourseConfig);
  app.post(
    "/api/contracts/config",
    { preHandler: [authenticate, requireRole("MANAGER", "ADMIN")] },
    handleSaveCourseConfig,
  );

  // Webhook do Autentique — precisa do corpo cru (bytes) pra verificar a assinatura HMAC,
  // então este contexto substitui o parser de JSON só aqui dentro (encapsulamento do Fastify),
  // sem afetar o parser global usado pelo resto do app.
  await app.register(async (scoped) => {
    scoped.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
      (req as typeof req & { rawBody: Buffer }).rawBody = body as Buffer;
      try {
        done(null, JSON.parse((body as Buffer).toString("utf8")));
      } catch (err) {
        done(err as Error, undefined);
      }
    });
    scoped.post("/api/webhooks/autentique", handleAutentiqueWebhook);
  });
}
