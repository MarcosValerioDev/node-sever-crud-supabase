import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.spec.ts"],
    environment: "node",
    env: {
      NODE_ENV: "test",
      // Os testes usam dublês em memória: o banco real nunca é acessado.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_SECRET: "test-secret-com-no-minimo-32-caracteres!!",
    },
  },
});
