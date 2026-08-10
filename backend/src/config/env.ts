import { z } from "zod";

const envSchema = z.object({
  // Identidade do projeto
  APP_NAME: z.string().min(1).default("backend"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  // Banco de dados
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL válida"),

  // Segredos JWT — nunca usar o padrão em produção
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET deve ter ao menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET deve ter ao menos 32 caracteres"),

  // TTL dos tokens (formato: "15m", "7d", "1h", "3600s")
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),

  // CORS — uma ou mais origens separadas por vírgula
  // Ex.: "http://localhost:3000" ou "http://localhost:3000,https://app.example.com"
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN é obrigatório"),

  // Cookie secret — usado para assinar cookies (mínimo 32 chars em produção)
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET deve ter ao menos 32 caracteres"),

  // E-mail transacional via Resend
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY é obrigatória"),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM é obrigatório"),

  // URL pública do front-end (usada nos links dos e-mails)
  APP_URL: z.string().url("APP_URL deve ser uma URL válida"),

  // Storage de arquivos via Bunny.net Edge Storage
  // Variáveis opcionais — o servidor sobe sem elas, mas uploads falham se não configuradas
  BUNNY_STORAGE_ACCESS_KEY: z.string().default(""),
  BUNNY_STORAGE_ZONE: z.string().default(""),
  // Endpoint regional: storage.bunnycdn.com | uk. | ny. | la. | sg. | se. | br. | jh. | syd.
  BUNNY_STORAGE_REGION: z.string().default("storage.bunnycdn.com"),
  // URL pública do pull zone (sem trailing slash): https://meu-pullzone.b-cdn.net
  BUNNY_CDN_URL: z.string().default(""),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`\n[${process.env["APP_NAME"] ?? "backend"}] Variáveis de ambiente inválidas:\n${formatted}\n`);
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;

/** Lista de origens CORS parseada de CORS_ORIGIN (suporta vírgulas). */
export const corsOrigins: string[] = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
