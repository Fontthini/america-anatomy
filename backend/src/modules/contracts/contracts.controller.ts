import type { FastifyRequest, FastifyReply } from "fastify";
import { submitContractSchema, courseConfigSchema } from "./contracts.schemas.js";
import {
  submitContract,
  listContracts,
  saveCourseConfig,
  updateCourseConfig,
  deleteCourseConfig,
  listCourseConfigs,
} from "./contracts.service.js";

export async function handleSubmitContract(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { slug } = req.params as { slug: string };
  const input = submitContractSchema.parse(req.body);
  const result = await submitContract(slug, input);
  reply.status(201).send(result);
}

export async function handleListContracts(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const contracts = await listContracts();
  reply.status(200).send(contracts);
}

export async function handleListCourseConfigs(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const configs = await listCourseConfigs();
  reply.status(200).send(configs);
}

export async function handleSaveCourseConfig(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = courseConfigSchema.parse(req.body);
  const config = await saveCourseConfig(input, req.user.id);
  reply.status(201).send(config);
}

export async function handleUpdateCourseConfig(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = courseConfigSchema.parse(req.body);
  const config = await updateCourseConfig(id, input);
  reply.status(200).send(config);
}

export async function handleDeleteCourseConfig(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  await deleteCourseConfig(id);
  reply.status(204).send();
}
