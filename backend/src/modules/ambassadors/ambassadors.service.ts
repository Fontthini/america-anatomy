import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import type {
  CreateAmbassadorApplicationInput,
  AmbassadorApplicationResponse,
} from "./ambassadors.schemas.js";
import type { AmbassadorApplication, AmbassadorApplicationStatus } from "@prisma/client";

function toResponse(app: AmbassadorApplication): AmbassadorApplicationResponse {
  return {
    id: app.id,
    name: app.name,
    email: app.email,
    whatsapp: app.whatsapp,
    profileType: app.profileType,
    alreadyKnowsAai: app.alreadyKnowsAai,
    availableForLives: app.availableForLives,
    hasNetwork: app.hasNetwork,
    notes: app.notes,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
  };
}

/** Formulário público — sem login, sem criar conta (mesmo padrão de CourseRegistration). */
export async function createAmbassadorApplication(
  input: CreateAmbassadorApplicationInput,
): Promise<AmbassadorApplicationResponse> {
  const application = await prisma.ambassadorApplication.create({ data: input });
  return toResponse(application);
}

export async function listAmbassadorApplications(): Promise<AmbassadorApplicationResponse[]> {
  const applications = await prisma.ambassadorApplication.findMany({ orderBy: { createdAt: "desc" } });
  return applications.map(toResponse);
}

export async function updateAmbassadorApplicationStatus(
  id: string,
  status: AmbassadorApplicationStatus,
): Promise<AmbassadorApplicationResponse> {
  const existing = await prisma.ambassadorApplication.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "AMBASSADOR_APPLICATION_NOT_FOUND", "Candidatura não encontrada.");
  }
  const updated = await prisma.ambassadorApplication.update({ where: { id }, data: { status } });
  return toResponse(updated);
}
