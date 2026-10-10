export type DomainErrorCode = "NOT_FOUND" | "CONFLICT" | "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION";

/**
 * Erros de domínio não conhecem HTTP: carregam apenas um `code`.
 * A tradução para status HTTP acontece no error.middleware.
 */
export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
}

export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION";
}
