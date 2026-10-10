import type { UserEntity } from "../../domain/entities/user.entity";
import { toIsoString } from "../../shared/utils/date.util";
import type { UserResponseDto } from "../dtos/user.dto";

export class UserMapper {
  /** Nunca expõe a senha: este é o único formato de usuário que sai da API. */
  static toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      createdAt: toIsoString(user.createdAt),
      updatedAt: toIsoString(user.updatedAt),
    };
  }

  static toResponseList(users: UserEntity[]): UserResponseDto[] {
    return users.map((user) => UserMapper.toResponse(user));
  }
}
