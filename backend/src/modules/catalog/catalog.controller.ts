import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createCatalogItemSchema,
  updateCatalogItemSchema,
  listCatalogItemsQuerySchema,
  registerInterestSchema,
  updateRegistrationStatusSchema,
} from "./catalog.schemas.js";
import {
  listCatalogItems,
  getCatalogItemById,
  createCatalogItem,
  updateCatalogItem,
  archiveCatalogItem,
  getPublicCourseBySlug,
  createCourseRegistration,
  listCourseRegistrations,
  updateRegistrationStatus,
  listEnrolledDoctors,
} from "./catalog.service.js";

function isStaffOrAdmin(req: FastifyRequest): boolean {
  return req.user.role === "MANAGER" || req.user.role === "ADMIN";
}

export async function handleListCatalogItems(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = listCatalogItemsQuerySchema.parse(req.query);
  const items = await listCatalogItems(query, isStaffOrAdmin(req));
  reply.status(200).send(items);
}

export async function handleGetCatalogItem(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const item = await getCatalogItemById(id, isStaffOrAdmin(req));
  reply.status(200).send(item);
}

export async function handleCreateCatalogItem(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = createCatalogItemSchema.parse(req.body);
  const item = await createCatalogItem(input);
  reply.status(201).send(item);
}

export async function handleUpdateCatalogItem(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateCatalogItemSchema.parse(req.body);
  const item = await updateCatalogItem(id, input);
  reply.status(200).send(item);
}

export async function handleArchiveCatalogItem(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const item = await archiveCatalogItem(id);
  reply.status(200).send(item);
}

export async function handleGetPublicCourse(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { slug } = req.params as { slug: string };
  const item = await getPublicCourseBySlug(slug);
  reply.status(200).send(item);
}

export async function handleCreateCourseRegistration(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const input = registerInterestSchema.parse(req.body);
  const registration = await createCourseRegistration(id, input);
  reply.status(201).send(registration);
}

export async function handleListCourseRegistrations(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const registrations = await listCourseRegistrations(id);
  reply.status(200).send(registrations);
}

export async function handleUpdateRegistrationStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { regId } = req.params as { id: string; regId: string };
  const input = updateRegistrationStatusSchema.parse(req.body);
  const registration = await updateRegistrationStatus(regId, input.status);
  reply.status(200).send(registration);
}

export async function handleListEnrolledDoctors(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = req.params as { id: string };
  const enrolled = await listEnrolledDoctors(id);
  reply.status(200).send(enrolled);
}
