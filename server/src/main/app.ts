import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { ENV } from "../shared/config/env.config";
import { API_PREFIX, JSON_BODY_LIMIT } from "../shared/constants/app.constants";
import { HTTP_STATUS } from "../shared/constants/http-status";
import { errorMiddleware, notFoundMiddleware } from "../shared/middlewares/error.middleware";
import { globalRateLimiter } from "../shared/middlewares/rate-limit.middleware";
import type { AppDependencies } from "./factories/dependencies.factory";
import { createRoutes } from "./routes";

const parseCorsOrigin = (corsOrigin: string): string | string[] =>
  corsOrigin === "*" ? "*" : corsOrigin.split(",").map((origin) => origin.trim());

export const createApp = (dependencies: AppDependencies): Express => {
  const app = express();

  app.set("trust proxy", ENV.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: parseCorsOrigin(ENV.CORS_ORIGIN) }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(globalRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(HTTP_STATUS.OK).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(API_PREFIX, createRoutes(dependencies));

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
