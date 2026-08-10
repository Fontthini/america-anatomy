import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createReferralSchema,
  listReferralsQuerySchema,
  updateReferralStatusSchema,
  launchCommissionSchema,
} from "./referrals.schemas.js";
import {
  createReferral,
  listMyReferrals,
  listReferrals,
  updateReferralStatus,
  launchCommission,
} from "./referrals.service.js";

function actorFromReq(req: FastifyRequest) {
  return { id: req.user.id, name: req.user.name, role: req.user.role };
}

export async function handleCreateReferral(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createReferralSchema.parse(req.body);
  const referral = await createReferral(req.user.id, input);
  reply.status(201).send(referral);
}

export async function handleListMyReferrals(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const referrals = await listMyReferrals(req.user.id);
  reply.status(200).send(referrals);
}

export async function handleListReferrals(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listReferralsQuerySchema.parse(req.query);
  const referrals = await listReferrals(actorFromReq(req), query);
  reply.status(200).send(referrals);
}

export async function handleUpdateReferralStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateReferralStatusSchema.parse(req.body);
  const referral = await updateReferralStatus(actorFromReq(req), id, input.status);
  reply.status(200).send(referral);
}

export async function handleLaunchCommission(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = launchCommissionSchema.parse(req.body);
  const referral = await launchCommission(actorFromReq(req), id, input.amount);
  reply.status(200).send(referral);
}
