import { z } from "zod";

export const createAmbassadorApplicationSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(150),
  email: z.string().email("E-mail inválido."),
  whatsapp: z.string().min(8, "WhatsApp inválido.").max(30),
  profileType: z.string().min(1, "Selecione seu perfil.").max(60),
  alreadyKnowsAai: z.boolean(),
  availableForLives: z.boolean(),
  hasNetwork: z.boolean(),
  notes: z.string().max(500).optional(),
});

export const updateAmbassadorApplicationStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "APPROVED", "REJECTED"]),
});

export type CreateAmbassadorApplicationInput = z.infer<typeof createAmbassadorApplicationSchema>;
export type UpdateAmbassadorApplicationStatusInput = z.infer<typeof updateAmbassadorApplicationStatusSchema>;

export type AmbassadorApplicationResponse = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  profileType: string;
  alreadyKnowsAai: boolean;
  availableForLives: boolean;
  hasNetwork: boolean;
  notes: string | null;
  status: "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";
  createdAt: string;
};
