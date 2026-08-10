import { buildApp } from "./app.js";
import { env, corsOrigins } from "./config/env.js";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`\n[${env.APP_NAME}] Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`  CORS: ${corsOrigins.join(", ")}`);
    console.log(`  Ambiente: ${env.NODE_ENV}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
