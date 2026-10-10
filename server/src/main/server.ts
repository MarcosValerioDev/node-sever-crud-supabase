import { prisma } from "../infrastructure/database/connection";
import { ENV } from "../shared/config/env.config";
import { API_PREFIX } from "../shared/constants/app.constants";
import { createApp } from "./app";
import { makeDependencies } from "./factories/dependencies.factory";

const app = createApp(makeDependencies());

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${ENV.PORT}${API_PREFIX} [${ENV.NODE_ENV}]`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`\n${signal} recebido. Encerrando o servidor...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
