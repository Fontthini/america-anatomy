import type { FastifyRequest, FastifyReply } from "fastify";
import {
  updateFunnelStageSchema,
  listLeadsQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  createActivitySchema,
  createReminderSchema,
  updateReminderSchema,
} from "./crm.schemas.js";
import {
  listLeads,
  updateFunnelStage,
  claimLead,
  createLead,
  updateLead,
  listLeadActivities,
  createLeadActivity,
  listLeadReminders,
  createLeadReminder,
  updateLeadReminder,
  getPasswordSetupLink,
} from "./crm.service.js";

function actorFromReq(req: FastifyRequest) {
  return { id: req.user.id, name: req.user.name, role: req.user.role };
}

export async function handleListLeads(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listLeadsQuerySchema.parse(req.query);
  const leads = await listLeads(actorFromReq(req), query);
  reply.status(200).send(leads);
}

export async function handleCreateLead(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createLeadSchema.parse(req.body);
  const lead = await createLead(actorFromReq(req), input);
  reply.status(201).send(lead);
}

export async function handleGetPasswordSetupLink(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const url = await getPasswordSetupLink(actorFromReq(req), id);
  reply.status(200).send({ url });
}

export async function handleUpdateLead(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateLeadSchema.parse(req.body);
  const lead = await updateLead(actorFromReq(req), id, input);
  reply.status(200).send(lead);
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

export async function handleListLeadActivities(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const activities = await listLeadActivities(actorFromReq(req), id);
  reply.status(200).send(activities);
}

export async function handleCreateLeadActivity(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = createActivitySchema.parse(req.body);
  const activity = await createLeadActivity(actorFromReq(req), id, input);
  reply.status(201).send(activity);
}

export async function handleListLeadReminders(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const reminders = await listLeadReminders(actorFromReq(req), id);
  reply.status(200).send(reminders);
}

export async function handleCreateLeadReminder(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = createReminderSchema.parse(req.body);
  const reminder = await createLeadReminder(actorFromReq(req), id, input);
  reply.status(201).send(reminder);
}

export async function handleUpdateLeadReminder(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { reminderId } = req.params as { id: string; reminderId: string };
  const input = updateReminderSchema.parse(req.body);
  const reminder = await updateLeadReminder(actorFromReq(req), reminderId, input.done);
  reply.status(200).send(reminder);
}
