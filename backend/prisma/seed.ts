/**
 * Seed de desenvolvimento.
 * Cria o usuário demo alinhado com as credenciais do front-end mockado:
 *   E-mail: demo@demo.com
 *   Senha:  demo1234
 *
 * Executar: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@demo.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário demo já existe (id: ${existing.id}). Pulando seed.`);
    return;
  }

  const passwordHash = await argon2.hash("demo1234", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const user = await prisma.user.create({
    data: {
      id: "u_001",
      name: "Alex Moreira",
      email,
      passwordHash,
      bio: "Designer-engenheiro. Construindo produtos com restrição.",
      role: "Owner",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✅ Usuário demo criado: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
