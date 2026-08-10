import type { FastifyRequest, FastifyReply } from "fastify";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications.service.js";

export async function handleGetNotifications(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const notifications = await getNotifications(req.user.id);
  reply.status(200).send(notifications);
}

export async function handleMarkRead(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  await markNotificationRead(req.user.id, req.params.id);
  reply.status(204).send();
}

export async function handleMarkAllRead(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await markAllNotificationsRead(req.user.id);
  reply.status(204).send();
}
