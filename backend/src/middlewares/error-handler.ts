import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

type HttpError = {
  statusCode?: number;
  code?: string;
  message?: string;
};

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: unknown, _req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados de entrada inválidos.",
          details: error.flatten().fieldErrors,
        },
      });
    }

    const httpError = error as HttpError;

    // Erros de limite de arquivo do @fastify/multipart
    if (
      httpError.statusCode === 413 ||
      httpError.code === "FST_PLUGIN_MULTIPART_FILE_SIZE_LIMIT"
    ) {
      return reply.status(413).send({
        error: {
          code: "FILE_TOO_LARGE",
          message: "Arquivo muito grande. Máximo permitido: 2 MB.",
        },
      });
    }

    // Erros de validação do Fastify (body malformado, etc.)
    if (httpError.statusCode === 400) {
      return reply.status(400).send({
        error: {
          code: "BAD_REQUEST",
          message: httpError.message ?? "Requisição inválida.",
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno do servidor.",
      },
    });
  });
}
