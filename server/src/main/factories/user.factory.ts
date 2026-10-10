import { UserController } from "../../app/controllers/user.controller";
import { UserService } from "../../app/services/user.service";
import type { AppDependencies } from "./dependencies.factory";

export const makeUserService = ({ userRepository, hashProvider, blockReasonRepository }: AppDependencies): UserService =>
  new UserService(userRepository, hashProvider, blockReasonRepository);

export const makeUserController = (dependencies: AppDependencies): UserController =>
  new UserController(makeUserService(dependencies));
