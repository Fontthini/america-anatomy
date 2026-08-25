import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import { upsertLeadFromCourseInterest, expressCourseInterestAsExistingDoctor } from "../crm/crm.service.js";
import type {
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
  ListCatalogItemsQuery,
  CatalogItemResponse,
  RegisterInterestInput,
  CourseRegistrationResponse,
  PublicCatalogItemResponse,
  EnrolledDoctorResponse,
  CreateCourseMaterialInput,
  UpdateCourseMaterialInput,
  CourseMaterialResponse,
} from "./catalog.schemas.js";
import type { CatalogItem, CourseRegistration, CourseRegistrationStatus, CourseMaterial } from "@prisma/client";

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "item";
  let slug = base;
  let suffix = 1;
  while (await prisma.catalogItem.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

type CatalogItemWithInstructor = CatalogItem & { instructor?: { name: string } | null };

function toCatalogItemResponse(item: CatalogItemWithInstructor, confirmedOrders: number): CatalogItemResponse {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    slug: item.slug,
    description: item.description,
    imageUrl: item.imageUrl,
    price: item.price ? item.price.toString() : null,
    category: item.category,
    startsAt: item.startsAt ? item.startsAt.toISOString() : null,
    endsAt: item.endsAt ? item.endsAt.toISOString() : null,
    location: item.location,
    isOnline: item.isOnline,
    capacity: item.capacity,
    vagasRestantes: item.capacity !== null ? Math.max(item.capacity - confirmedOrders, 0) : null,
    instructorUserId: item.instructorUserId,
    instructorName: item.instructor?.name ?? null,
    sku: item.sku,
    stockQty: item.stockQty,
    createdAt: item.createdAt.toISOString(),
  };
}

async function countConfirmedOrdersByItem(itemIds: string[]): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();
  const groups = await prisma.order.groupBy({
    by: ["catalogItemId"],
    where: { catalogItemId: { in: itemIds }, status: "CONFIRMED" },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.catalogItemId, g._count._all]));
}

/** doctors só enxergam PUBLISHED, independentemente do filtro solicitado; staff/admin enxergam qualquer status. */
export async function listCatalogItems(
  query: ListCatalogItemsQuery,
  isStaffOrAdmin: boolean,
): Promise<CatalogItemResponse[]> {
  const where = {
    ...(query.type ? { type: query.type } : {}),
    status: isStaffOrAdmin ? query.status : "PUBLISHED",
  };
  const items = await prisma.catalogItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { instructor: { select: { name: true } } },
  });
  const counts = await countConfirmedOrdersByItem(items.map((i) => i.id));
  return items.map((item) => toCatalogItemResponse(item, counts.get(item.id) ?? 0));
}

export async function getCatalogItemById(
  id: string,
  isStaffOrAdmin: boolean,
): Promise<CatalogItemResponse> {
  const item = await prisma.catalogItem.findUnique({
    where: { id },
    include: { instructor: { select: { name: true } } },
  });
  if (!item || (!isStaffOrAdmin && item.status !== "PUBLISHED")) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de catálogo não encontrado.");
  }
  const counts = await countConfirmedOrdersByItem([item.id]);
  return toCatalogItemResponse(item, counts.get(item.id) ?? 0);
}

export async function createCatalogItem(input: CreateCatalogItemInput): Promise<CatalogItemResponse> {
  const slug = await generateUniqueSlug(input.title);
  const item = await prisma.catalogItem.create({
    data: {
      type: input.type,
      title: input.title,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      price: input.price,
      category: input.category,
      ...(input.type === "PRODUCT"
        ? { sku: input.sku, stockQty: input.stockQty }
        : {
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            location: input.location,
            isOnline: input.isOnline,
            capacity: input.capacity,
            instructorUserId: input.instructorUserId,
          }),
    },
    include: { instructor: { select: { name: true } } },
  });
  return toCatalogItemResponse(item, 0);
}

export async function updateCatalogItem(
  id: string,
  input: UpdateCatalogItemInput,
): Promise<CatalogItemResponse> {
  const existing = await prisma.catalogItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de catálogo não encontrado.");
  }
  const item = await prisma.catalogItem.update({
    where: { id },
    data: input,
    include: { instructor: { select: { name: true } } },
  });
  const counts = await countConfirmedOrdersByItem([item.id]);
  return toCatalogItemResponse(item, counts.get(item.id) ?? 0);
}

export async function archiveCatalogItem(id: string): Promise<CatalogItemResponse> {
  return updateCatalogItem(id, { status: "ARCHIVED" });
}

// ---------------------------------------------------------------------------
// Página pública de curso/seminário + inscrição de interesse (sem login)
// ---------------------------------------------------------------------------

function toCourseRegistrationResponse(reg: CourseRegistration): CourseRegistrationResponse {
  return {
    id: reg.id,
    catalogItemId: reg.catalogItemId,
    name: reg.name,
    email: reg.email,
    crm: reg.crm,
    whatsapp: reg.whatsapp,
    notes: reg.notes,
    status: reg.status,
    createdAt: reg.createdAt.toISOString(),
  };
}

export async function getPublicCourseBySlug(slug: string): Promise<PublicCatalogItemResponse> {
  const item = await prisma.catalogItem.findUnique({ where: { slug } });
  if (!item || item.status !== "PUBLISHED" || (item.type !== "COURSE" && item.type !== "SEMINAR")) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Curso não encontrado.");
  }
  const counts = await countConfirmedOrdersByItem([item.id]);
  const confirmedOrders = counts.get(item.id) ?? 0;
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    slug: item.slug,
    description: item.description,
    imageUrl: item.imageUrl,
    price: item.price ? item.price.toString() : null,
    startsAt: item.startsAt ? item.startsAt.toISOString() : null,
    endsAt: item.endsAt ? item.endsAt.toISOString() : null,
    location: item.location,
    isOnline: item.isOnline,
    vagasRestantes: item.capacity !== null ? Math.max(item.capacity - confirmedOrders, 0) : null,
  };
}

async function findEventItemOrThrow(catalogItemId: string): Promise<CatalogItem> {
  const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!item || item.status !== "PUBLISHED" || (item.type !== "COURSE" && item.type !== "SEMINAR")) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Curso não encontrado.");
  }
  return item;
}

/** Staff sempre passa; médico só se for o instrutor responsável por aquele item. */
async function assertCourseAccess(catalogItemId: string, userId: string, isStaffOrAdmin: boolean): Promise<void> {
  if (isStaffOrAdmin) return;
  const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId }, select: { instructorUserId: true } });
  if (!item || item.instructorUserId !== userId) {
    throw new AppError(403, "FORBIDDEN", "Você não tem permissão para acessar este curso.");
  }
}

/** Cursos/seminários onde o médico logado é o instrutor responsável — "Painel do Instrutor". */
export async function listMyInstructedCourses(userId: string): Promise<CatalogItemResponse[]> {
  const items = await prisma.catalogItem.findMany({
    where: { instructorUserId: userId },
    orderBy: { startsAt: "asc" },
    include: { instructor: { select: { name: true } } },
  });
  const counts = await countConfirmedOrdersByItem(items.map((i) => i.id));
  return items.map((item) => toCatalogItemResponse(item, counts.get(item.id) ?? 0));
}

/** Formulário público — médico parceiro sem conta demonstra interesse num curso/seminário. */
export async function createCourseRegistration(
  catalogItemId: string,
  input: RegisterInterestInput,
): Promise<CourseRegistrationResponse> {
  const item = await findEventItemOrThrow(catalogItemId);

  const registration = await prisma.courseRegistration.create({
    data: { catalogItemId: item.id, ...input },
  });

  const staff = await prisma.user.findMany({ where: { role: { in: ["MANAGER", "ADMIN"] } }, select: { id: true } });
  for (const member of staff) {
    void createNotification(member.id, NotificationType.NEW_COURSE_REGISTRATION);
  }

  // O interesse também vira um contato de verdade no funil do CRM, com a "caixinha"
  // do curso — pra quem vende saber de qual landing page/curso o contato veio.
  await upsertLeadFromCourseInterest(item.id, item.title, {
    name: input.name,
    email: input.email,
    whatsapp: input.whatsapp,
    ...(input.crm ? { crm: input.crm } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  });

  return toCourseRegistrationResponse(registration);
}

/**
 * Médico já logado demonstra interesse num curso que ainda não comprou, pela
 * "mini landing page" dentro do próprio portal (`/medico/cursos/:id`). Não
 * cria pedido — só marca o curso de interesse no contato dele no CRM e
 * registra no histórico, pro comercial fechar a matrícula manualmente.
 */
export async function expressCourseInterestAsDoctor(catalogItemId: string, userId: string): Promise<void> {
  const item = await findEventItemOrThrow(catalogItemId);
  const profile = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Perfil de médico não encontrado.");
  }
  await expressCourseInterestAsExistingDoctor(profile.id, item.id, item.title);
}

export async function listCourseRegistrations(
  catalogItemId: string,
  userId: string,
  isStaffOrAdmin: boolean,
): Promise<CourseRegistrationResponse[]> {
  await assertCourseAccess(catalogItemId, userId, isStaffOrAdmin);
  const registrations = await prisma.courseRegistration.findMany({
    where: { catalogItemId },
    orderBy: { createdAt: "desc" },
  });
  return registrations.map(toCourseRegistrationResponse);
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: CourseRegistrationStatus,
  userId: string,
  isStaffOrAdmin: boolean,
): Promise<CourseRegistrationResponse> {
  const existing = await prisma.courseRegistration.findUnique({ where: { id: registrationId } });
  if (!existing) {
    throw new AppError(404, "COURSE_REGISTRATION_NOT_FOUND", "Inscrição não encontrada.");
  }
  await assertCourseAccess(existing.catalogItemId, userId, isStaffOrAdmin);
  const updated = await prisma.courseRegistration.update({ where: { id: registrationId }, data: { status } });
  return toCourseRegistrationResponse(updated);
}

/** Médicos que já têm conta e se inscreveram de verdade (Order confirmado) — roster real do curso. */
export async function listEnrolledDoctors(
  catalogItemId: string,
  userId: string,
  isStaffOrAdmin: boolean,
): Promise<EnrolledDoctorResponse[]> {
  await assertCourseAccess(catalogItemId, userId, isStaffOrAdmin);
  const orders = await prisma.order.findMany({
    where: { catalogItemId, status: "CONFIRMED" },
    include: { doctorProfile: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((order) => ({
    orderId: order.id,
    doctorProfileId: order.doctorProfileId,
    name: order.doctorProfile.user.name,
    email: order.doctorProfile.user.email,
    crm: order.doctorProfile.crm,
    phone: order.doctorProfile.phone,
    createdAt: order.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Materiais do curso (vídeos/PDFs/links) — só pra quem se inscreveu, ou staff
// ---------------------------------------------------------------------------

function toCourseMaterialResponse(material: CourseMaterial): CourseMaterialResponse {
  return {
    id: material.id,
    catalogItemId: material.catalogItemId,
    title: material.title,
    type: material.type,
    url: material.url,
    order: material.order,
    createdAt: material.createdAt.toISOString(),
  };
}

async function isDoctorEnrolled(userId: string, catalogItemId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { catalogItemId, status: "CONFIRMED", doctorProfile: { userId } },
    select: { id: true },
  });
  return order !== null;
}

/** Médico vê os materiais se estiver inscrito (Order confirmado) OU for o instrutor do curso; staff/admin sempre vê. */
export async function listCourseMaterials(
  catalogItemId: string,
  userId: string,
  isStaffOrAdmin: boolean,
): Promise<CourseMaterialResponse[]> {
  if (!isStaffOrAdmin) {
    const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId }, select: { instructorUserId: true } });
    const isInstructor = item?.instructorUserId === userId;
    if (!isInstructor) {
      const enrolled = await isDoctorEnrolled(userId, catalogItemId);
      if (!enrolled) {
        throw new AppError(403, "ENROLLMENT_REQUIRED", "Inscreva-se neste curso para acessar os materiais.");
      }
    }
  }
  const materials = await prisma.courseMaterial.findMany({
    where: { catalogItemId },
    orderBy: { order: "asc" },
  });
  return materials.map(toCourseMaterialResponse);
}

export async function createCourseMaterial(
  catalogItemId: string,
  input: CreateCourseMaterialInput,
  userId: string,
  isStaffOrAdmin: boolean,
): Promise<CourseMaterialResponse> {
  const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!item) {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de catálogo não encontrado.");
  }
  await assertCourseAccess(catalogItemId, userId, isStaffOrAdmin);
  const material = await prisma.courseMaterial.create({ data: { catalogItemId, ...input } });
  return toCourseMaterialResponse(material);
}

export async function updateCourseMaterial(
  materialId: string,
  input: UpdateCourseMaterialInput,
  userId: string,
  isStaffOrAdmin: boolean,
): Promise<CourseMaterialResponse> {
  const existing = await prisma.courseMaterial.findUnique({ where: { id: materialId } });
  if (!existing) {
    throw new AppError(404, "COURSE_MATERIAL_NOT_FOUND", "Material não encontrado.");
  }
  await assertCourseAccess(existing.catalogItemId, userId, isStaffOrAdmin);
  const material = await prisma.courseMaterial.update({ where: { id: materialId }, data: input });
  return toCourseMaterialResponse(material);
}

export async function deleteCourseMaterial(materialId: string, userId: string, isStaffOrAdmin: boolean): Promise<void> {
  const existing = await prisma.courseMaterial.findUnique({ where: { id: materialId } });
  if (!existing) {
    throw new AppError(404, "COURSE_MATERIAL_NOT_FOUND", "Material não encontrado.");
  }
  await assertCourseAccess(existing.catalogItemId, userId, isStaffOrAdmin);
  await prisma.courseMaterial.delete({ where: { id: materialId } });
}
