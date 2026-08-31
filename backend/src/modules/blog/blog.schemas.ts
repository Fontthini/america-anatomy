import { z } from "zod";

// z.string().url() aceita "javascript:..." — bloqueado renderizado como href
// no frontend do artigo. Restringe a http/https.
const httpUrl = (message: string) =>
  z
    .string()
    .url(message)
    .refine((v) => /^https?:\/\//i.test(v), { message: "URL deve começar com http:// ou https://." });

export const articleMaterialSchema = z.object({
  name: z.string().min(1, "Nome do material é obrigatório.").max(120),
  url: httpUrl("URL de material inválida."),
});

export const createArticleSchema = z.object({
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres.").max(200),
  content: z.string().min(1, "Conteúdo é obrigatório."),
  coverImageUrl: httpUrl("URL de imagem inválida.").optional(),
  videoUrl: httpUrl("URL de vídeo inválida.").optional(),
  category: z.string().max(60).optional(),
  materials: z.array(articleMaterialSchema).max(20).default([]),
  published: z.boolean().default(false),
});

export const updateArticleSchema = createArticleSchema.partial();

export const listArticlesQuerySchema = z.object({
  category: z.string().optional(),
});

export type ArticleMaterial = z.infer<typeof articleMaterialSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

export type ArticleResponse = {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  videoUrl: string | null;
  category: string | null;
  materials: ArticleMaterial[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
};
