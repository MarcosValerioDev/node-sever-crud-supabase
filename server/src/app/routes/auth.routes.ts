import { Router, type RequestHandler } from "express";
import { authorize } from "../../shared/middlewares/auth.middleware";
import { signInRateLimiter } from "../../shared/middlewares/rate-limit.middleware";
import type { AuthController } from "../controllers/auth.controller";

export interface AuthRoutesDependencies {
  authController: AuthController;
  authenticate: RequestHandler;
}

export const createAuthRoutes = ({ authController, authenticate }: AuthRoutesDependencies): Router => {
  const authRoutes = Router();

  authRoutes.post("/signin", signInRateLimiter, authController.signIn);
  authRoutes.post("/signup", authenticate, authorize("ADMIN"), authController.signUp);

  return authRoutes;
};
