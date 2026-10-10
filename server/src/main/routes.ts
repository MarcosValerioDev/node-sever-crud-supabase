import { Router } from "express";
import { createAuthRoutes } from "../app/routes/auth.routes";
import { createDocsRoutes } from "../app/routes/docs.routes";
import { createUserRoutes } from "../app/routes/user.routes";
import { makeAuthenticate } from "../shared/middlewares/auth.middleware";
import { makeAuthController } from "./factories/auth.factory";
import type { AppDependencies } from "./factories/dependencies.factory";
import { makeUserController } from "./factories/user.factory";

export const createRoutes = (dependencies: AppDependencies): Router => {
  const routes = Router();
  const authenticate = makeAuthenticate(dependencies.tokenProvider, dependencies.userRepository);

  routes.use("/docs", createDocsRoutes());
  routes.use("/auth", createAuthRoutes({ authController: makeAuthController(dependencies), authenticate }));
  routes.use("/users", createUserRoutes({ userController: makeUserController(dependencies), authenticate }));

  return routes;
};
