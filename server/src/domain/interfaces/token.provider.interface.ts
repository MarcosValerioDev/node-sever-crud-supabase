import type { UserRole } from "../entities/user.entity";

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export interface ITokenProvider {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
