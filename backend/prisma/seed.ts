/**
 * Seed de desenvolvimento.
 * Cria usuários de teste:
 *   Admin:            admin@demo.com   / demo1234  (role ADMIN)
 *   Gerente:          gerente@demo.com / demo1234  (role MANAGER)
 *   Vendedor:         vendedor@demo.com/ demo1234  (role SALES_REP)
 *   Médico aprovado:  medico@demo.com  / demo1234  (role DOCTOR, approvalStatus APPROVED)
 *   Médico pendente:  pendente@demo.com/ demo1234  (role DOCTOR, approvalStatus PENDING, atribuído ao vendedor)
 *
 * Executar: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function hash(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  const passwordHash = await hash("demo1234");

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      id: "u_admin",
      name: "Ana Diretora",
      email: "admin@demo.com",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email} (id: ${admin.id})`);

  const manager = await prisma.user.upsert({
    where: { email: "gerente@demo.com" },
    update: {},
    create: {
      id: "u_gerente",
      name: "Gabriela Gerente",
      email: "gerente@demo.com",
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Gerente: ${manager.email} (id: ${manager.id})`);

  const salesRep = await prisma.user.upsert({
    where: { email: "vendedor@demo.com" },
    update: {},
    create: {
      id: "u_vendedor",
      name: "Vinícius Vendedor",
      email: "vendedor@demo.com",
      passwordHash,
      role: "SALES_REP",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Vendedor: ${salesRep.email} (id: ${salesRep.id})`);

  const approvedDoctor = await prisma.user.upsert({
    where: { email: "medico@demo.com" },
    update: {},
    create: {
      id: "u_medico_ok",
      name: "Dr. Carlos Medeiros",
      email: "medico@demo.com",
      passwordHash,
      role: "DOCTOR",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      doctorProfile: {
        create: {
          crm: "CRM-SP 123456",
          specialty: "Ortopedia",
          clinicName: "Clínica Medeiros",
          city: "São Paulo",
          state: "SP",
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          approvedByUserId: admin.id,
        },
      },
    },
  });
  console.log(`✅ Médico aprovado: ${approvedDoctor.email} (id: ${approvedDoctor.id})`);

  const pendingDoctor = await prisma.user.upsert({
    where: { email: "pendente@demo.com" },
    update: {},
    create: {
      id: "u_medico_pendente",
      name: "Dra. Beatriz Souza",
      email: "pendente@demo.com",
      passwordHash,
      role: "DOCTOR",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      doctorProfile: {
        create: {
          crm: "CRM-RJ 654321",
          specialty: "Dermatologia",
          clinicName: "Souza Estética",
          city: "Rio de Janeiro",
          state: "RJ",
          approvalStatus: "PENDING",
          assignedSalesRepId: salesRep.id,
        },
      },
    },
  });
  console.log(`✅ Médico pendente: ${pendingDoctor.email} (id: ${pendingDoctor.id})`);

  const products: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
    price: number;
    sku: string;
    stockQty: number;
  }> = [
    {
      slug: "modelo-coluna-vertebral",
      title: "Modelo Anatômico — Coluna Vertebral",
      description: "Peça de alta fidelidade, tamanho real, ideal para consultório e didática.",
      category: "Anatomia Óssea",
      price: 890,
      sku: "AAI-COL-01",
      stockQty: 40,
    },
    {
      slug: "modelo-cranio-didatico",
      title: "Modelo Anatômico — Crânio Didático",
      description: "Crânio desmontável em 8 partes, com numeração das estruturas.",
      category: "Anatomia Óssea",
      price: 650,
      sku: "AAI-CRA-01",
      stockQty: 25,
    },
    {
      slug: "kit-membro-superior",
      title: "Kit Membro Superior Completo",
      description: "Conjunto articulado de ombro, braço, antebraço e mão.",
      category: "Membros",
      price: 1290,
      sku: "AAI-MS-01",
      stockQty: 12,
    },
    {
      slug: "modelo-coracao-seccionado",
      title: "Modelo de Coração Seccionado",
      description: "Duas partes, mostra câmaras internas e grandes vasos.",
      category: "Anatomia Visceral",
      price: 420,
      sku: "AAI-COR-01",
      stockQty: 30,
    },
    {
      slug: "torso-humano-15-partes",
      title: "Torso Humano — 15 Partes",
      description: "Torso completo com órgãos removíveis, base para estudo sistêmico.",
      category: "Anatomia Visceral",
      price: 2190,
      sku: "AAI-TOR-01",
      stockQty: 8,
    },
  ];

  for (const p of products) {
    await prisma.catalogItem.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        type: "PRODUCT",
        status: "PUBLISHED",
        title: p.title,
        slug: p.slug,
        description: p.description,
        category: p.category,
        price: p.price,
        sku: p.sku,
        stockQty: p.stockQty,
      },
    });
  }
  console.log(`✅ ${products.length} produtos publicados na Loja`);

  const events: Array<{
    slug: string;
    title: string;
    type: "COURSE" | "SEMINAR";
    description: string;
    daysFromNow: number;
    location: string;
    isOnline: boolean;
    capacity: number;
    price: number;
  }> = [
    {
      slug: "curso-anatomia-aplicada-cirurgia",
      title: "Curso de Anatomia Aplicada à Cirurgia",
      type: "COURSE",
      description: "3 dias de curso presencial com dissecção guiada por especialistas.",
      daysFromNow: 30,
      location: "São Paulo, SP",
      isOnline: false,
      capacity: 20,
      price: 4200,
    },
    {
      slug: "seminario-atualizacao-anatomia-cranial",
      title: "Seminário de Atualização em Anatomia Cranial",
      type: "SEMINAR",
      description: "Encontro de um dia com especialistas convidados, transmissão ao vivo.",
      daysFromNow: 10,
      location: "Online",
      isOnline: true,
      capacity: 100,
      price: 390,
    },
  ];

  for (const e of events) {
    const startsAt = new Date(Date.now() + e.daysFromNow * 86400000);
    await prisma.catalogItem.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        type: e.type,
        status: "PUBLISHED",
        title: e.title,
        slug: e.slug,
        description: e.description,
        startsAt,
        location: e.location,
        isOnline: e.isOnline,
        capacity: e.capacity,
        price: e.price,
      },
    });
  }
  console.log(`✅ ${events.length} cursos/seminários publicados`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
