import type { UserEntity, UserRole } from "../entities/user.entity";

export interface CreateUserData {
  email: string;
  name: string | null;
  password: string;
  role: UserRole;
}

export type UpdateUserData = Partial<CreateUserData & { isActive: boolean }>;

export interface FindAllUsersParams {
  skip: number;
  take: number;
}

export interface FindAllUsersResult {
  users: UserEntity[];
  total: number;
}

export interface IUserRepository {
  save(data: CreateUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(params: FindAllUsersParams): Promise<FindAllUsersResult>;
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  /** Marca o usuário como bloqueado e registra o motivo, de forma atômica. */
  block(id: string, reason: string): Promise<UserEntity>;
  unblock(id: string): Promise<UserEntity>;
}
