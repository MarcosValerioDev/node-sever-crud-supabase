import { z } from "zod";
import { createUserSchema, emailSchema, roleSchema } from "./user.validator";

export const signInSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

export const signUpSchema = createUserSchema.extend({
  role: roleSchema.default("USER"),
});
