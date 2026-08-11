import type { FastifyRequest, FastifyReply } from "fastify";
import { createAmbassadorApplicationSchema, updateAmbassadorApplicationStatusSchema } from "./ambassadors.schemas.js";
import {
  createAmbassadorApplication,
  listAmbassadorApplications,
  updateAmbassadorApplicationStatus,
} from "./ambassadors.service.js";

export async function handleCreateAmbassadorApplication(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createAmbassadorApplicationSchema.parse(req.body);
  const application = await createAmbassadorApplication(input);
  reply.status(201).send(application);
}

export async function handleListAmbassadorApplications(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const applications = await listAmbassadorApplications();
  reply.status(200).send(applications);
}

export async function handleUpdateAmbassadorApplicationStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateAmbassadorApplicationStatusSchema.parse(req.body);
  const application = await updateAmbassadorApplicationStatus(id, input.status);
  reply.status(200).send(application);
}
