#!/usr/bin/env node
/**
 * Bootstrap script — npm run setup
 *
 * 1. Copia .env.example para .env (se .env não existir)
 * 2. Instala dependências (npm install)
 * 3. Gera o Prisma Client e aplica as migrations (prisma migrate dev)
 *
 * Uso:  node scripts/setup.mjs
 *       npm run setup
 */

import { existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}

// 1. Copiar .env.example → .env
const envPath = join(root, ".env");
const envExamplePath = join(root, ".env.example");

if (!existsSync(envPath)) {
  if (!existsSync(envExamplePath)) {
    console.error("Erro: .env.example não encontrado. Verifique o repositório.");
    process.exit(1);
  }
  copyFileSync(envExamplePath, envPath);
  console.log("✅ .env criado a partir de .env.example");
  console.log("   ⚠️  Preencha as variáveis em .env antes de continuar!\n");
} else {
  console.log("ℹ️  .env já existe — pulando cópia.");
}

// 2. Instalar dependências
run("npm install");

// 3. Gerar Prisma Client e migrar
run("npx prisma generate");
run("npx prisma migrate dev --name init");

console.log("\n✅ Setup concluído. Inicie o servidor com: npm run dev\n");
