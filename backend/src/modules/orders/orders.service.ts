import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import type { CreateOrderInput, OrderResponse } from "./orders.schemas.js";
import type { Order, CatalogItem } from "@prisma/client";

function toOrderResponse(order: Order & { catalogItem: CatalogItem }): OrderResponse {
  return {
    id: order.id,
    catalogItemId: order.catalogItemId,
    catalogItemTitle: order.catalogItem.title,
    catalogItemType: order.catalogItem.type,
    quantity: order.quantity,
    status: order.status,
    unitPrice: order.unitPrice ? order.unitPrice.toString() : null,
    createdAt: order.createdAt.toISOString(),
  };
}

async function getDoctorProfileIdOrThrow(userId: string): Promise<string> {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) {
    throw new AppError(404, "DOCTOR_PROFILE_NOT_FOUND", "Perfil de médico não encontrado.");
  }
  return profile.id;
}

export async function createOrder(userId: string, input: CreateOrderInput): Promise<OrderResponse> {
  const doctorProfileId = await getDoctorProfileIdOrThrow(userId);

  const catalogItem = await prisma.catalogItem.findUnique({ where: { id: input.catalogItemId } });
  if (!catalogItem || catalogItem.status !== "PUBLISHED") {
    throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de catálogo não encontrado.");
  }

  const isEvent = catalogItem.type === "COURSE" || catalogItem.type === "SEMINAR";
  const quantity = isEvent ? 1 : input.quantity;

  const order = await prisma.$transaction(async (tx) => {
    if (isEvent && catalogItem.capacity !== null) {
      const confirmedCount = await tx.order.count({
        where: { catalogItemId: catalogItem.id, status: "CONFIRMED" },
      });
      if (confirmedCount >= catalogItem.capacity) {
        const code = catalogItem.type === "SEMINAR" ? "SEMINAR_FULL" : "COURSE_FULL";
        throw new AppError(409, code, "Não há mais vagas disponíveis para este item.");
      }
    }

    return tx.order.create({
      data: {
        doctorProfileId,
        catalogItemId: catalogItem.id,
        quantity,
        status: "CONFIRMED",
        unitPrice: catalogItem.price,
      },
      include: { catalogItem: true },
    });
  });

  void createNotification(userId, NotificationType.ORDER_CREATED);

  return toOrderResponse(order);
}

export async function listMyOrders(userId: string): Promise<OrderResponse[]> {
  const doctorProfileId = await getDoctorProfileIdOrThrow(userId);
  const orders = await prisma.order.findMany({
    where: { doctorProfileId },
    include: { catalogItem: true },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toOrderResponse);
}
