import { z } from "zod";
import { USER_ROLES } from "../../domain/entities/user.entity";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../shared/constants/app.constants";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72; // limite de bytes do bcrypt

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido"));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra")
  .regex(/\d/, "A senha deve conter ao menos um número");

const nameSchema = z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres").max(100);

export const roleSchema = z.enum(USER_ROLES);

export const userIdParamSchema = z.object({
  id: z.uuid("ID inválido"),
});

export const createUserSchema = z.strictObject({
  name: nameSchema.optional(),
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserSchema = z
  .strictObject({
    name: nameSchema.nullable(),
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo para atualizar");

export const blockUserSchema = z.strictObject({
  reason: z.string().trim().min(3, "O motivo deve ter no mínimo 3 caracteres").max(500),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
