import { prisma } from "../src/infrastructure/database/connection";
import { BcryptHashProvider } from "../src/infrastructure/providers/hash.provider";
import { ENV } from "../src/shared/config/env.config";

/**
 * Cria (ou promove) o primeiro ADMIN, necessário porque o /auth/signup é restrito a ADMIN.
 * Uso: defina ADMIN_EMAIL e ADMIN_PASSWORD no .env e rode `npm run db:seed`.
 */
const seedAdmin = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env para rodar o seed");
  }

  const hashProvider = new BcryptHashProvider(ENV.BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", isActive: true, isBlocked: false },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME ?? "Administrador",
      password: await hashProvider.hash(adminPassword),
      role: "ADMIN",
    },
  });

  console.log(`✅ ADMIN pronto: ${admin.email}`);
};

seedAdmin()
  .catch((error: unknown) => {
    console.error("❌ Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
