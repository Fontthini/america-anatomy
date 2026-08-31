import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

// Reaproveita a mesma instância entre invocações "quentes" da função —
// evita reconstruir o app Fastify (registrar plugins/rotas) a cada request.
let appPromise: Promise<FastifyInstance> | null = null;

async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

/**
 * Entry point de função serverless da Vercel. Fastify não expõe um handler
 * (req,res) nativo — mas `app.server` é um http.Server de verdade por baixo
 * dos panos, então emitir o evento "request" nele aciona o roteamento do
 * Fastify normalmente, sem precisar de app.listen().
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit("request", req, res);
}
