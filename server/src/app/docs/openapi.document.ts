import { z } from "zod";
import { USER_ROLES } from "../../domain/entities/user.entity";
import { API_PREFIX } from "../../shared/constants/app.constants";
import { signInSchema, signUpSchema } from "../validators/auth.validator";
import { blockUserSchema, createUserSchema, updateUserSchema } from "../validators/user.validator";

/** Converte um schema de entrada do zod em JSON Schema: a documentação segue a validação real. */
const toRequestSchema = (schema: z.ZodType): Record<string, unknown> => {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" });
  return jsonSchema;
};

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonBody = (schemaName: string) => ({
  required: true,
  content: { "application/json": { schema: ref(schemaName) } },
});

const jsonResponse = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: { "application/json": { schema } },
});

const errorResponse = (description: string) => jsonResponse(description, ref("ErrorResponse"));

const AUTH_ERRORS = {
  401: errorResponse("Token ausente ou inválido"),
  403: errorResponse("Sem permissão, usuário bloqueado ou inativo"),
};

const userIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const bearerAuth = [{ bearerAuth: [] }];

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "API de Usuários",
    version: "1.0.0",
    description:
      "API REST com autenticação JWT, perfis USER/ADMIN e bloqueio de usuários. " +
      "Faça login em `POST /auth/signin` e use o `accessToken` no botão **Authorize**.",
  },
  servers: [{ url: API_PREFIX }],
  tags: [
    { name: "Autenticação", description: "Login e cadastro feito por ADMIN" },
    { name: "Usuários", description: "CRUD, bloqueio e histórico de bloqueios" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      SignInRequest: toRequestSchema(signInSchema),
      SignUpRequest: toRequestSchema(signUpSchema),
      CreateUserRequest: toRequestSchema(createUserSchema),
      UpdateUserRequest: toRequestSchema(updateUserSchema),
      BlockUserRequest: toRequestSchema(blockUserSchema),
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: ["string", "null"] },
          role: { type: "string", enum: USER_ROLES },
          isActive: { type: "boolean" },
          isBlocked: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "email", "name", "role", "isActive", "isBlocked", "createdAt", "updatedAt"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          tokenType: { type: "string", const: "Bearer" },
          user: ref("UserResponse"),
        },
        required: ["accessToken", "tokenType", "user"],
      },
      PaginatedUsersResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: ref("UserResponse") },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
        required: ["data", "meta"],
      },
      BlockReasonResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          reason: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "userId", "reason", "createdAt"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", examples: ["VALIDATION", "NOT_FOUND", "FORBIDDEN"] },
              message: { type: "string" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: { field: { type: "string" }, message: { type: "string" } },
                },
              },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
    },
  },
  paths: {
    "/auth/signin": {
      post: {
        tags: ["Autenticação"],
        summary: "Login",
        description: "Limitado a 5 tentativas falhas a cada 15 minutos.",
        requestBody: jsonBody("SignInRequest"),
        responses: {
          200: jsonResponse("Autenticado", ref("AuthResponse")),
          400: errorResponse("Dados inválidos"),
          401: errorResponse("E-mail ou senha inválidos"),
          403: errorResponse("Usuário bloqueado ou inativo"),
          429: errorResponse("Muitas tentativas"),
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Autenticação"],
        summary: "Cadastrar usuário (ADMIN)",
        description: "Permite definir o perfil (`role`) do novo usuário.",
        security: bearerAuth,
        requestBody: jsonBody("SignUpRequest"),
        responses: {
          201: jsonResponse("Usuário criado", ref("UserResponse")),
          400: errorResponse("Dados inválidos"),
          ...AUTH_ERRORS,
          409: errorResponse("E-mail já cadastrado"),
        },
      },
    },
    "/users": {
      post: {
        tags: ["Usuários"],
        summary: "Cadastro próprio",
        description: "Público. O usuário é sempre criado com perfil `USER`.",
        requestBody: jsonBody("CreateUserRequest"),
        responses: {
          201: jsonResponse("Usuário criado", ref("UserResponse")),
          400: errorResponse("Dados inválidos"),
          409: errorResponse("E-mail já cadastrado"),
        },
      },
      get: {
        tags: ["Usuários"],
        summary: "Listar usuários (ADMIN)",
        security: bearerAuth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        ],
        responses: {
          200: jsonResponse("Lista paginada", ref("PaginatedUsersResponse")),
          400: errorResponse("Parâmetros inválidos"),
          ...AUTH_ERRORS,
        },
      },
    },
    "/users/{id}": {
      parameters: [userIdParameter],
      get: {
        tags: ["Usuários"],
        summary: "Buscar usuário",
        description: "Dono da conta ou ADMIN.",
        security: bearerAuth,
        responses: {
          200: jsonResponse("Usuário", ref("UserResponse")),
          ...AUTH_ERRORS,
          404: errorResponse("Usuário não encontrado"),
        },
      },
      patch: {
        tags: ["Usuários"],
        summary: "Atualizar usuário",
        description: "Dono da conta ou ADMIN. Apenas ADMIN altera `role` e `isActive`.",
        security: bearerAuth,
        requestBody: jsonBody("UpdateUserRequest"),
        responses: {
          200: jsonResponse("Usuário atualizado", ref("UserResponse")),
          400: errorResponse("Dados inválidos"),
          ...AUTH_ERRORS,
          404: errorResponse("Usuário não encontrado"),
          409: errorResponse("E-mail já cadastrado"),
        },
      },
      delete: {
        tags: ["Usuários"],
        summary: "Excluir usuário",
        description: "Dono da conta ou ADMIN.",
        security: bearerAuth,
        responses: {
          204: { description: "Usuário excluído" },
          ...AUTH_ERRORS,
          404: errorResponse("Usuário não encontrado"),
        },
      },
    },
    "/users/{id}/block": {
      parameters: [userIdParameter],
      patch: {
        tags: ["Usuários"],
        summary: "Bloquear usuário (ADMIN)",
        description: "Registra o motivo no histórico. O ADMIN não pode bloquear a si mesmo.",
        security: bearerAuth,
        requestBody: jsonBody("BlockUserRequest"),
        responses: {
          200: jsonResponse("Usuário bloqueado", ref("UserResponse")),
          400: errorResponse("Dados inválidos"),
          ...AUTH_ERRORS,
          404: errorResponse("Usuário não encontrado"),
        },
      },
    },
    "/users/{id}/unblock": {
      parameters: [userIdParameter],
      patch: {
        tags: ["Usuários"],
        summary: "Desbloquear usuário (ADMIN)",
        description: "O histórico de motivos é mantido.",
        security: bearerAuth,
        responses: {
          200: jsonResponse("Usuário desbloqueado", ref("UserResponse")),
          ...AUTH_ERRORS,
          404: errorResponse("Usuário não encontrado"),
        },
      },
    },
    "/users/{id}/block-reasons": {
      parameters: [userIdParameter],
      get: {
        tags: ["Usuários"],
        summary: "Histórico de bloqueios (ADMIN)",
        security: bearerAuth,
        responses: {
          200: jsonResponse("Histórico", { type: "array", items: ref("BlockReasonResponse") }),
          ...AUTH_ERRORS,
          404: errorResponse("Usuário não encontrado"),
        },
      },
    },
  },
};
