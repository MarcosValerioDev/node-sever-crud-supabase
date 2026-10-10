import { Prisma, type User as PrismaUser } from "../database/prisma/generated/client";
import type { DatabaseClient } from "../database/connection";
import { UserEntity } from "../../domain/entities/user.entity";
import { ConflictError, NotFoundError } from "../../domain/errors/domain.error";
import type {
  CreateUserData,
  FindAllUsersParams,
  FindAllUsersResult,
  IUserRepository,
  UpdateUserData,
} from "../../domain/interfaces/user.repository.interface";

const PRISMA_UNIQUE_VIOLATION = "P2002";
const PRISMA_RECORD_NOT_FOUND = "P2025";

export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async save(data: CreateUserData): Promise<UserEntity> {
    try {
      const user = await this.databaseClient.user.create({ data });
      return this.toEntity(user);
    } catch (error) {
      throw this.translateError(error);
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.databaseClient.user.findUnique({ where: { id } });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.databaseClient.user.findUnique({ where: { email } });
    return user ? this.toEntity(user) : null;
  }

  async findAll({ skip, take }: FindAllUsersParams): Promise<FindAllUsersResult> {
    const [users, total] = await this.databaseClient.$transaction([
      this.databaseClient.user.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
      this.databaseClient.user.count(),
    ]);

    return { users: users.map((user) => this.toEntity(user)), total };
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    try {
      const user = await this.databaseClient.user.update({ where: { id }, data });
      return this.toEntity(user);
    } catch (error) {
      throw this.translateError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.databaseClient.user.delete({ where: { id } });
    } catch (error) {
      throw this.translateError(error);
    }
  }

  async block(id: string, reason: string): Promise<UserEntity> {
    try {
      const [user] = await this.databaseClient.$transaction([
        this.databaseClient.user.update({ where: { id }, data: { isBlocked: true } }),
        this.databaseClient.blockReason.create({ data: { userId: id, reason } }),
      ]);
      return this.toEntity(user);
    } catch (error) {
      throw this.translateError(error);
    }
  }

  async unblock(id: string): Promise<UserEntity> {
    try {
      const user = await this.databaseClient.user.update({ where: { id }, data: { isBlocked: false } });
      return this.toEntity(user);
    } catch (error) {
      throw this.translateError(error);
    }
  }

  private toEntity(user: PrismaUser): UserEntity {
    return new UserEntity(user);
  }

  private translateError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PRISMA_UNIQUE_VIOLATION) return new ConflictError("E-mail já cadastrado");
      if (error.code === PRISMA_RECORD_NOT_FOUND) return new NotFoundError("Usuário não encontrado");
    }
    return error;
  }
}
