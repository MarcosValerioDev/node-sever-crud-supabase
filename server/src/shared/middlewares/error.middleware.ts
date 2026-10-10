import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { DomainError, type DomainErrorCode } from "../../domain/errors/domain.error";
import { IS_PRODUCTION } from "../config/env.config";
import { HTTP_STATUS, type HttpStatus } from "../constants/http-status";

const DOMAIN_ERROR_HTTP_STATUS: Record<DomainErrorCode, HttpStatus> = {
  NOT_FOUND: HTTP_STATUS.NOT_FOUND,
  CONFLICT: HTTP_STATUS.CONFLICT,
  UNAUTHORIZED: HTTP_STATUS.UNAUTHORIZED,
  FORBIDDEN: HTTP_STATUS.FORBIDDEN,
  VALIDATION: HTTP_STATUS.BAD_REQUEST,
};

/** Erros lançados pelo body-parser do Express (JSON malformado, payload grande etc.). */
interface HttpParserError extends Error {
  status: number;
  type: string;
}

const isHttpParserError = (error: unknown): error is HttpParserError =>
  error instanceof Error && "status" in error && "type" in error && typeof error.status === "number";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: { code: "ROUTE_NOT_FOUND", message: `Rota ${req.method} ${req.originalUrl} não encontrada` },
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof DomainError) {
    res.status(DOMAIN_ERROR_HTTP_STATUS[error.code]).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: {
        code: "VALIDATION",
        message: "Dados inválidos",
        details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
      },
    });
    return;
  }

  if (isHttpParserError(error) && error.status < HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    res.status(error.status).json({
      error: { code: "INVALID_REQUEST", message: "Corpo da requisição inválido" },
    });
    return;
  }

  console.error(error);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: IS_PRODUCTION ? "Erro interno do servidor" : String(error?.message ?? error),
    },
  });
};
