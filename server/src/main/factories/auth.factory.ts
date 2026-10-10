import { AuthController } from "../../app/controllers/auth.controller";
import { AuthService } from "../../app/services/auth.service";
import type { AppDependencies } from "./dependencies.factory";
import { makeUserService } from "./user.factory";

export const makeAuthService = (dependencies: AppDependencies): AuthService =>
  new AuthService(
    dependencies.userRepository,
    dependencies.hashProvider,
    dependencies.tokenProvider,
    makeUserService(dependencies),
  );

export const makeAuthController = (dependencies: AppDependencies): AuthController =>
  new AuthController(makeAuthService(dependencies));
