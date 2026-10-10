import { config } from "dotenv";
import { z } from "zod";

config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter no mínimo 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(14).default(10),
  CORS_ORIGIN: z.string().default("*"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.flattenError(parsedEnv.error).fieldErrors);
  process.exit(1);
}

export const ENV = parsedEnv.data;

export const IS_PRODUCTION = ENV.NODE_ENV === "production";
export const IS_TEST = ENV.NODE_ENV === "test";
