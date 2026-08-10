import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  catalogItemId: z.string().min(1, "catalogItemId é obrigatório."),
  quantity: z.number().int().positive().default(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type OrderResponse = {
  id: string;
  catalogItemId: string;
  catalogItemTitle: string;
  catalogItemType: string;
  quantity: number;
  status: OrderStatus;
  unitPrice: string | null;
  createdAt: string;
};
