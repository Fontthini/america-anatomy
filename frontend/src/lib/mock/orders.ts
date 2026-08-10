import { mockDelay } from "./index";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type Order = {
  id: string;
  catalogItemId: string;
  catalogItemTitle: string;
  catalogItemType: string;
  quantity: number;
  status: OrderStatus;
  unitPrice: string | null;
  createdAt: string;
};

export const mockMyOrders: Order[] = [
  {
    id: "ord_1",
    catalogItemId: "cat_2",
    catalogItemTitle: "Curso de Anatomia Aplicada à Cirurgia",
    catalogItemType: "COURSE",
    quantity: 1,
    status: "CONFIRMED",
    unitPrice: "4200.00",
    createdAt: new Date().toISOString(),
  },
];

export async function mockListMyOrders(): Promise<Order[]> {
  await mockDelay();
  return mockMyOrders;
}
