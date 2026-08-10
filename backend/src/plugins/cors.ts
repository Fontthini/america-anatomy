import type { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import { corsOrigins } from "../config/env.js";

export async function registerCors(app: FastifyInstance): Promise<void> {
  // Suporta uma ou múltiplas origens (CORS_ORIGIN separado por vírgula)
  const origin: string | string[] = corsOrigins.length === 1 ? corsOrigins[0]! : corsOrigins;

  await app.register(fastifyCors, {
    origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}
