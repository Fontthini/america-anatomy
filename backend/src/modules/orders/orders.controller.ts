import type { FastifyRequest, FastifyReply } from "fastify";
import { createOrderSchema } from "./orders.schemas.js";
import { createOrder, listMyOrders } from "./orders.service.js";

export async function handleCreateOrder(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createOrderSchema.parse(req.body);
  const order = await createOrder(req.user.id, input);
  reply.status(201).send(order);
}

export async function handleListMyOrders(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const orders = await listMyOrders(req.user.id);
  reply.status(200).send(orders);
}
