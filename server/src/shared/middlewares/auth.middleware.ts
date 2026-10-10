import type { Request, RequestHandler } from "express";
import type { UserRole } from "../../domain/entities/user.entity";
import { ForbiddenError, UnauthorizedError } from "../../domain/errors/domain.error";
import type { AuthenticatedUser } from "../../domain/interfaces/authenticated-user.interface";
import type { ITokenProvider } from "../../domain/interfaces/token.provider.interface";
import type { IUserRepository } from "../../domain/interfaces/user.repository.interface";

const BEARER_PREFIX = "Bearer ";

/**
 * Valida o token e confere o usuário no banco a cada requisição: bloquear, inativar,
 * excluir ou trocar o perfil de alguém tem efeito imediato, mesmo com token ainda válido.
 */
export const makeAuthenticate =
  (tokenProvider: ITokenProvider, userRepository: IUserRepository): RequestHandler =>
  async (req, _res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedError("Token de acesso não informado");
    }

    const { sub } = tokenProvider.verify(authorizationHeader.slice(BEARER_PREFIX.length));
    const user = await userRepository.findById(sub);

    if (!user) throw new UnauthorizedError("Usuário não encontrado");
    if (user.isBlocked) throw new ForbiddenError("Usuário bloqueado. Procure um administrador");
    if (!user.isActive) throw new ForbiddenError("Usuário inativo. Procure um administrador");

    req.user = { id: user.id, role: user.role };
    next();
  };

/** Deve ser usado depois do `authenticate`. */
export const authorize =
  (...allowedRoles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    const authenticatedUser = getAuthenticatedUser(req);

    if (!allowedRoles.includes(authenticatedUser.role)) {
      throw new ForbiddenError("Você não tem permissão para acessar este recurso");
    }

    next();
  };

export const getAuthenticatedUser = (req: Request): AuthenticatedUser => {
  if (!req.user) throw new UnauthorizedError("Usuário não autenticado");
  return req.user;
};
