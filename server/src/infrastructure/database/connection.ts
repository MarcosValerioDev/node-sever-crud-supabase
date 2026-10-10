import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./prisma/generated/client";
import { ENV } from "../../shared/config/env.config";

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: ENV.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export type DatabaseClient = typeof prisma;
