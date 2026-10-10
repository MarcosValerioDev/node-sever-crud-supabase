import type { IBlockReasonRepository } from "../../domain/interfaces/block-reason.repository.interface";
import type { IHashProvider } from "../../domain/interfaces/hash.provider.interface";
import type { ITokenProvider } from "../../domain/interfaces/token.provider.interface";
import type { IUserRepository } from "../../domain/interfaces/user.repository.interface";
import { prisma } from "../../infrastructure/database/connection";
import { BcryptHashProvider } from "../../infrastructure/providers/hash.provider";
import { JwtTokenProvider } from "../../infrastructure/providers/token.provider";
import { BlockReasonPrismaRepository } from "../../infrastructure/repositories/block-reason.prisma.repository";
import { UserPrismaRepository } from "../../infrastructure/repositories/user.prisma.repository";
import { ENV } from "../../shared/config/env.config";

/**
 * Implementações concretas usadas pela aplicação.
 * Nos testes, troque qualquer uma por um dublê (ex.: repositório em memória).
 */
export interface AppDependencies {
  userRepository: IUserRepository;
  blockReasonRepository: IBlockReasonRepository;
  hashProvider: IHashProvider;
  tokenProvider: ITokenProvider;
}

export const makeDependencies = (): AppDependencies => ({
  userRepository: new UserPrismaRepository(prisma),
  blockReasonRepository: new BlockReasonPrismaRepository(prisma),
  hashProvider: new BcryptHashProvider(ENV.BCRYPT_SALT_ROUNDS),
  tokenProvider: new JwtTokenProvider(ENV.JWT_SECRET, ENV.JWT_EXPIRES_IN),
});
