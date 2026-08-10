import type { FastifyRequest, FastifyReply } from "fastify";
import { updateFunnelStageSchema, listLeadsQuerySchema, requestReviewSchema } from "./crm.schemas.js";
import { listLeads, updateFunnelStage, claimLead, requestReview } from "./crm.service.js";

function actorFromReq(req: FastifyRequest) {
  return { id: req.user.id, name: req.user.name, role: req.user.role };
}

export async function handleListLeads(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listLeadsQuerySchema.parse(req.query);
  const leads = await listLeads(actorFromReq(req), query);
  reply.status(200).send(leads);
}

export async function handleUpdateFunnelStage(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateFunnelStageSchema.parse(req.body);
  const lead = await updateFunnelStage(actorFromReq(req), id, input);
  reply.status(200).send(lead);
}

export async function handleClaimLead(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const lead = await claimLead(actorFromReq(req), id);
  reply.status(200).send(lead);
}

export async function handleRequestReview(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = requestReviewSchema.parse(req.body);
  const lead = await requestReview(actorFromReq(req), id, input);
  reply.status(200).send(lead);
}
