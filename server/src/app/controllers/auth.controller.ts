import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status";
import type { AuthService } from "../services/auth.service";
import { signInSchema, signUpSchema } from "../validators/auth.validator";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signIn = async (req: Request, res: Response): Promise<void> => {
    const signInDto = signInSchema.parse(req.body);
    const authResponse = await this.authService.signIn(signInDto);
    res.status(HTTP_STATUS.OK).json(authResponse);
  };

  signUp = async (req: Request, res: Response): Promise<void> => {
    const signUpDto = signUpSchema.parse(req.body);
    const user = await this.authService.signUp(signUpDto);
    res.status(HTTP_STATUS.CREATED).json(user);
  };
}
