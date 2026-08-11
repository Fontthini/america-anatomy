import type { FastifyRequest, FastifyReply } from "fastify";
import { createArticleSchema, updateArticleSchema, listArticlesQuerySchema } from "./blog.schemas.js";
import { listArticles, getArticleById, createArticle, updateArticle, deleteArticle } from "./blog.service.js";

function isStaffOrAdmin(req: FastifyRequest): boolean {
  return req.user.role === "MANAGER" || req.user.role === "ADMIN";
}

export async function handleListArticles(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listArticlesQuerySchema.parse(req.query);
  const articles = await listArticles(query, isStaffOrAdmin(req));
  reply.status(200).send(articles);
}

export async function handleGetArticle(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const article = await getArticleById(id, isStaffOrAdmin(req));
  reply.status(200).send(article);
}

export async function handleCreateArticle(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createArticleSchema.parse(req.body);
  const article = await createArticle(input);
  reply.status(201).send(article);
}

export async function handleUpdateArticle(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateArticleSchema.parse(req.body);
  const article = await updateArticle(id, input);
  reply.status(200).send(article);
}

export async function handleDeleteArticle(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  await deleteArticle(id);
  reply.status(204).send();
}
