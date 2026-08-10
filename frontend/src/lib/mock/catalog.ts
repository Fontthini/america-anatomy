import { mockDelay } from "./index";

export type CatalogItemType = "PRODUCT" | "COURSE" | "SEMINAR";
export type CatalogItemStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CatalogItem = {
  id: string;
  type: CatalogItemType;
  status: CatalogItemStatus;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  capacity: number | null;
  vagasRestantes: number | null;
  sku: string | null;
  stockQty: number | null;
  createdAt: string;
};

export const mockCatalogItems: CatalogItem[] = [
  {
    id: "cat_1",
    type: "PRODUCT",
    status: "PUBLISHED",
    title: "Kit de Peças Anatômicas — Membro Superior",
    slug: "kit-pecas-membro-superior",
    description: "Conjunto completo de peças anatômicas de alta fidelidade para estudo de membro superior.",
    imageUrl: null,
    price: "1890.00",
    startsAt: null,
    endsAt: null,
    location: null,
    isOnline: false,
    capacity: null,
    vagasRestantes: null,
    sku: "AAI-MS-001",
    stockQty: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_2",
    type: "COURSE",
    status: "PUBLISHED",
    title: "Curso de Anatomia Aplicada à Cirurgia",
    slug: "curso-anatomia-aplicada-cirurgia",
    description: "Curso presencial de 3 dias com dissecção guiada.",
    imageUrl: null,
    price: "4200.00",
    startsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 33 * 86400000).toISOString(),
    location: "São Paulo, SP",
    isOnline: false,
    capacity: 20,
    vagasRestantes: 7,
    sku: null,
    stockQty: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_3",
    type: "SEMINAR",
    status: "PUBLISHED",
    title: "Seminário de Atualização em Anatomia Cranial",
    slug: "seminario-anatomia-cranial",
    description: "Encontro de um dia com especialistas convidados.",
    imageUrl: null,
    price: "890.00",
    startsAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 10 * 86400000 + 8 * 3600000).toISOString(),
    location: "Online",
    isOnline: true,
    capacity: 100,
    vagasRestantes: 3,
    sku: null,
    stockQty: null,
    createdAt: new Date().toISOString(),
  },
];

export async function mockListCatalogItems(): Promise<CatalogItem[]> {
  await mockDelay();
  return mockCatalogItems;
}

export async function mockGetCatalogItem(id: string): Promise<CatalogItem | undefined> {
  await mockDelay(400);
  return mockCatalogItems.find((i) => i.id === id);
}
