import { randomUUID } from "node:crypto";
import { BlockReasonEntity } from "../../domain/entities/block-reason.entity";
import { UserEntity, type UserProps } from "../../domain/entities/user.entity";
import type {
  CreateUserData,
  FindAllUsersParams,
  FindAllUsersResult,
  IUserRepository,
  UpdateUserData,
} from "../../domain/interfaces/user.repository.interface";

export class UserInMemoryRepository implements IUserRepository {
  users: UserEntity[] = [];
  blockReasons: BlockReasonEntity[] = [];

  async save(data: CreateUserData): Promise<UserEntity> {
    const now = new Date();
    const user = new UserEntity({
      id: randomUUID(),
      ...data,
      isActive: true,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    });
    this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findAll({ skip, take }: FindAllUsersParams): Promise<FindAllUsersResult> {
    return { users: this.users.slice(skip, skip + take), total: this.users.length };
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const definedData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    return this.replace(id, definedData);
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
    this.blockReasons = this.blockReasons.filter((blockReason) => blockReason.userId !== id);
  }

  async block(id: string, reason: string): Promise<UserEntity> {
    this.blockReasons.push(new BlockReasonEntity({ id: randomUUID(), userId: id, reason, createdAt: new Date() }));
    return this.replace(id, { isBlocked: true });
  }

  async unblock(id: string): Promise<UserEntity> {
    return this.replace(id, { isBlocked: false });
  }

  private replace(id: string, data: Partial<UserProps>): UserEntity {
    const index = this.users.findIndex((user) => user.id === id);
    const user = new UserEntity({ ...this.users[index], ...data, updatedAt: new Date() });
    this.users[index] = user;
    return user;
  }
}
