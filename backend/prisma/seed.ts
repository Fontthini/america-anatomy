/**
 * Seed de desenvolvimento.
 * Cria três usuários de teste:
 *   Admin:            admin@demo.com   / demo1234  (role ADMIN)
 *   Médico aprovado:  medico@demo.com  / demo1234  (role DOCTOR, approvalStatus APPROVED)
 *   Médico pendente:  pendente@demo.com/ demo1234  (role DOCTOR, approvalStatus PENDING)
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
        },
      },
    },
  });
  console.log(`✅ Médico pendente: ${pendingDoctor.email} (id: ${pendingDoctor.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
