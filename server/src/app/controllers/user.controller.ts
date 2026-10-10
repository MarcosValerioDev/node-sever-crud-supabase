import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status";
import { getAuthenticatedUser } from "../../shared/middlewares/auth.middleware";
import type { UserService } from "../services/user.service";
import {
  blockUserSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/user.validator";

export class UserController {
  constructor(private readonly userService: UserService) {}

  createUser = async (req: Request, res: Response): Promise<void> => {
    const createUserDto = createUserSchema.parse(req.body);
    const user = await this.userService.create(createUserDto);
    res.status(HTTP_STATUS.CREATED).json(user);
  };

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const listUsersQueryDto = listUsersQuerySchema.parse(req.query);
    const users = await this.userService.findAll(listUsersQueryDto);
    res.status(HTTP_STATUS.OK).json(users);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    const user = await this.userService.findById(id, getAuthenticatedUser(req));
    res.status(HTTP_STATUS.OK).json(user);
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    const updateUserDto = updateUserSchema.parse(req.body);
    const user = await this.userService.update(id, updateUserDto, getAuthenticatedUser(req));
    res.status(HTTP_STATUS.OK).json(user);
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    await this.userService.delete(id, getAuthenticatedUser(req));
    res.status(HTTP_STATUS.NO_CONTENT).send();
  };

  blockUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    const blockUserDto = blockUserSchema.parse(req.body);
    const user = await this.userService.block(id, blockUserDto, getAuthenticatedUser(req));
    res.status(HTTP_STATUS.OK).json(user);
  };

  unblockUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    const user = await this.userService.unblock(id);
    res.status(HTTP_STATUS.OK).json(user);
  };

  listBlockReasons = async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    const blockReasons = await this.userService.findBlockReasons(id);
    res.status(HTTP_STATUS.OK).json(blockReasons);
  };
}
