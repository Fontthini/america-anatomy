import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middlewares/error-handler.js";
import { createNotification, NotificationType } from "../../lib/notifications.js";
import { recordAutoFinancialEntry } from "../finance/finance.service.js";
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

  // Sem gateway de pagamento ainda: pedido confirmado já conta como "pago" pra
  // efeitos de financeiro e funil, igual o gatilho do peptideo (pedido pago → entrada + lead vira cliente).
  if (order.unitPrice) {
    void recordAutoFinancialEntry({
      type: "INCOME",
      category: "PEDIDO PAGO",
      description: `Pedido pago — ${order.catalogItem.title} (${order.quantity}x)`,
      amount: Number(order.unitPrice) * order.quantity,
    });
  }
  void prisma.doctorProfile.updateMany({
    where: { id: doctorProfileId, funnelStage: { not: "CUSTOMER" } },
    data: { funnelStage: "CUSTOMER" },
  });

  // Visibilidade pro comercial: pedido feito direto pelo médico (Loja/Cursos) não
  // passa pelo funil manual do CRM, então registra no histórico do contato pra
  // quem for fechar/cobrar saber o que foi pedido sem precisar cruzar telas.
  void prisma.leadActivity
    .create({
      data: {
        doctorProfileId,
        type: "NOTE",
        note: `Pedido feito pelo médico via portal: ${order.quantity}x ${order.catalogItem.title}.`,
        createdByUserId: null,
      },
    })
    .catch((err) => console.error("[orders] Falha ao registrar atividade no CRM:", err));

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
