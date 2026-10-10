import type { z } from "zod";
import type { UserRole } from "../../domain/entities/user.entity";
import type { PaginationMeta } from "../../shared/utils/pagination.util";
import type {
  blockUserSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../validators/user.validator";

export type CreateUserDto = z.infer<typeof createUserSchema> & { role?: UserRole };
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export type BlockUserDto = z.infer<typeof blockUserSchema>;

export interface UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockReasonResponseDto {
  id: string;
  userId: string;
  reason: string;
  createdAt: string;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}
