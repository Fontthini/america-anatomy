import type { FastifyRequest, FastifyReply } from "fastify";
import { submitContractSchema, courseConfigSchema } from "./contracts.schemas.js";
import {
  submitContract,
  listContracts,
  saveCourseConfig,
  getActiveCourseConfigResponse,
} from "./contracts.service.js";

export async function handleSubmitContract(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = submitContractSchema.parse(req.body);
  const result = await submitContract(input);
  reply.status(201).send(result);
}

export async function handleListContracts(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const contracts = await listContracts();
  reply.status(200).send(contracts);
}

export async function handleGetCourseConfig(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const config = await getActiveCourseConfigResponse();
  reply.status(200).send(config);
}

export async function handleSaveCourseConfig(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = courseConfigSchema.parse(req.body);
  const config = await saveCourseConfig(input, req.user.id);
  reply.status(201).send(config);
}
