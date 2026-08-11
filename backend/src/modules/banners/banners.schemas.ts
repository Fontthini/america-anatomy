import { z } from "zod";

export const createBannerSchema = z.object({
  placement: z.enum(["LOJA", "BLOG"]),
  imageUrl: z.string().url("URL de imagem inválida."),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(200).optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const updateBannerSchema = z.object({
  imageUrl: z.string().url().optional(),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(200).optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const listBannersQuerySchema = z.object({
  placement: z.enum(["LOJA", "BLOG"]).optional(),
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type ListBannersQuery = z.infer<typeof listBannersQuerySchema>;

export type BannerResponse = {
  id: string;
  placement: "LOJA" | "BLOG";
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  active: boolean;
  order: number;
  createdAt: string;
};
