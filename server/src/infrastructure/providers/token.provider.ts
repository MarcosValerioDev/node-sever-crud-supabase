import jwt, { type SignOptions } from "jsonwebtoken";
import { USER_ROLES, type UserRole } from "../../domain/entities/user.entity";
import { UnauthorizedError } from "../../domain/errors/domain.error";
import type { ITokenProvider, TokenPayload } from "../../domain/interfaces/token.provider.interface";

export class JwtTokenProvider implements ITokenProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign({ role: payload.role }, this.secret, {
      subject: payload.sub,
      expiresIn: this.expiresIn as SignOptions["expiresIn"],
    });
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret);

      if (typeof decoded === "string" || !decoded.sub || !this.isUserRole(decoded.role)) {
        throw new UnauthorizedError("Token inválido");
      }

      return { sub: decoded.sub, role: decoded.role };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError("Token inválido ou expirado");
    }
  }

  private isUserRole(value: unknown): value is UserRole {
    return USER_ROLES.includes(value as UserRole);
  }
}
