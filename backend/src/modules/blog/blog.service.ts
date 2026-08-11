import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import type {
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesQuery,
  ArticleResponse,
  ArticleMaterial,
} from "./blog.schemas.js";
import type { Article, Prisma } from "@prisma/client";

function toArticleResponse(article: Article): ArticleResponse {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    coverImageUrl: article.coverImageUrl,
    videoUrl: article.videoUrl,
    category: article.category,
    materials: (article.materials as ArticleMaterial[] | null) ?? [],
    published: article.published,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    createdAt: article.createdAt.toISOString(),
  };
}

/** Médicos só enxergam artigos publicados; staff/admin enxergam tudo (inclui rascunhos). */
export async function listArticles(
  query: ListArticlesQuery,
  isStaffOrAdmin: boolean,
): Promise<ArticleResponse[]> {
  const articles = await prisma.article.findMany({
    where: {
      ...(query.category ? { category: query.category } : {}),
      ...(isStaffOrAdmin ? {} : { published: true }),
    },
    orderBy: { createdAt: "desc" },
  });
  return articles.map(toArticleResponse);
}

export async function getArticleById(id: string, isStaffOrAdmin: boolean): Promise<ArticleResponse> {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article || (!isStaffOrAdmin && !article.published)) {
    throw new AppError(404, "ARTICLE_NOT_FOUND", "Artigo não encontrado.");
  }
  return toArticleResponse(article);
}

export async function createArticle(input: CreateArticleInput): Promise<ArticleResponse> {
  const article = await prisma.article.create({
    data: {
      title: input.title,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      videoUrl: input.videoUrl,
      category: input.category,
      materials: input.materials as unknown as Prisma.InputJsonValue,
      published: input.published,
      publishedAt: input.published ? new Date() : null,
    },
  });
  return toArticleResponse(article);
}

export async function updateArticle(id: string, input: UpdateArticleInput): Promise<ArticleResponse> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "ARTICLE_NOT_FOUND", "Artigo não encontrado.");
  }

  const becomingPublished = input.published === true && !existing.published;

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.videoUrl !== undefined ? { videoUrl: input.videoUrl } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.materials !== undefined
        ? { materials: input.materials as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(becomingPublished ? { publishedAt: new Date() } : {}),
    },
  });
  return toArticleResponse(article);
}

export async function deleteArticle(id: string): Promise<void> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "ARTICLE_NOT_FOUND", "Artigo não encontrado.");
  }
  await prisma.article.delete({ where: { id } });
}
