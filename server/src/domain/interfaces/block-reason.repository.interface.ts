import type { BlockReasonEntity } from "../entities/block-reason.entity";

export interface IBlockReasonRepository {
  findAllByUserId(userId: string): Promise<BlockReasonEntity[]>;
}
