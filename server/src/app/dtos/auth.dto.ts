import type { z } from "zod";
import type { signInSchema, signUpSchema } from "../validators/auth.validator";
import type { UserResponseDto } from "./user.dto";

export type SignInDto = z.infer<typeof signInSchema>;
export type SignUpDto = z.infer<typeof signUpSchema>;

export interface AuthResponseDto {
  accessToken: string;
  tokenType: "Bearer";
  user: UserResponseDto;
}
