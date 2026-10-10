import type { DatabaseClient } from "../database/connection";
import { BlockReasonEntity } from "../../domain/entities/block-reason.entity";
import type { IBlockReasonRepository } from "../../domain/interfaces/block-reason.repository.interface";

export class BlockReasonPrismaRepository implements IBlockReasonRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async findAllByUserId(userId: string): Promise<BlockReasonEntity[]> {
    const blockReasons = await this.databaseClient.blockReason.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return blockReasons.map((blockReason) => new BlockReasonEntity(blockReason));
  }
}
