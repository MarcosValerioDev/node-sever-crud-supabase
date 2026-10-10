import type { BlockReasonEntity } from "../../domain/entities/block-reason.entity";
import { toIsoString } from "../../shared/utils/date.util";
import type { BlockReasonResponseDto } from "../dtos/user.dto";

export class BlockReasonMapper {
  static toResponse(blockReason: BlockReasonEntity): BlockReasonResponseDto {
    return {
      id: blockReason.id,
      userId: blockReason.userId,
      reason: blockReason.reason,
      createdAt: toIsoString(blockReason.createdAt),
    };
  }

  static toResponseList(blockReasons: BlockReasonEntity[]): BlockReasonResponseDto[] {
    return blockReasons.map((blockReason) => BlockReasonMapper.toResponse(blockReason));
  }
}
