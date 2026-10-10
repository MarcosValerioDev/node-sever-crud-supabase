import { Router, type RequestHandler } from "express";
import { authorize } from "../../shared/middlewares/auth.middleware";
import type { UserController } from "../controllers/user.controller";

export interface UserRoutesDependencies {
  userController: UserController;
  authenticate: RequestHandler;
}

export const createUserRoutes = ({ userController, authenticate }: UserRoutesDependencies): Router => {
  const userRoutes = Router();

  userRoutes.post("/", userController.createUser);
  userRoutes.get("/", authenticate, authorize("ADMIN"), userController.listUsers);
  userRoutes.get("/:id", authenticate, userController.getUserById);
  userRoutes.patch("/:id", authenticate, userController.updateUser);
  userRoutes.delete("/:id", authenticate, userController.deleteUser);

  userRoutes.patch("/:id/block", authenticate, authorize("ADMIN"), userController.blockUser);
  userRoutes.patch("/:id/unblock", authenticate, authorize("ADMIN"), userController.unblockUser);
  userRoutes.get("/:id/block-reasons", authenticate, authorize("ADMIN"), userController.listBlockReasons);

  return userRoutes;
};
