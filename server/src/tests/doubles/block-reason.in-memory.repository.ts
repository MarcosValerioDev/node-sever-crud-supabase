import type { BlockReasonEntity } from "../../domain/entities/block-reason.entity";
import type { IBlockReasonRepository } from "../../domain/interfaces/block-reason.repository.interface";
import type { UserInMemoryRepository } from "./user.in-memory.repository";

/** Lê os motivos gravados pelo UserInMemoryRepository.block (mesmo "banco" em memória). */
export class BlockReasonInMemoryRepository implements IBlockReasonRepository {
  constructor(private readonly userRepository: UserInMemoryRepository) {}

  async findAllByUserId(userId: string): Promise<BlockReasonEntity[]> {
    return this.userRepository.blockReasons
      .filter((blockReason) => blockReason.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
