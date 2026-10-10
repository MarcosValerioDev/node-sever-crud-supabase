import type { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { JwtTokenProvider } from "../../infrastructure/providers/token.provider";
import { createApp } from "../../main/app";
import { HTTP_STATUS } from "../../shared/constants/http-status";
import { BlockReasonInMemoryRepository } from "../doubles/block-reason.in-memory.repository";
import { FakeHashProvider } from "../doubles/fake.hash.provider";
import { UserInMemoryRepository } from "../doubles/user.in-memory.repository";

describe("Rotas de documentação (Swagger)", () => {
  let app: Express;

  beforeEach(() => {
    const userRepository = new UserInMemoryRepository();

    app = createApp({
      userRepository,
      blockReasonRepository: new BlockReasonInMemoryRepository(userRepository),
      hashProvider: new FakeHashProvider(),
      tokenProvider: new JwtTokenProvider(process.env.JWT_SECRET!, "1h"),
    });
  });

  it("GET /api/docs/openapi.json retorna o documento OpenAPI com todas as rotas", async () => {
    const response = await request(app).get("/api/docs/openapi.json");

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.body.openapi).toBe("3.1.0");
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        "/auth/signin",
        "/auth/signup",
        "/users",
        "/users/{id}",
        "/users/{id}/block",
        "/users/{id}/unblock",
        "/users/{id}/block-reasons",
      ]),
    );
  });

  it("schemas de entrada são gerados a partir dos validators zod", async () => {
    const response = await request(app).get("/api/docs/openapi.json");
    const { CreateUserRequest } = response.body.components.schemas;

    expect(CreateUserRequest.required).toEqual(expect.arrayContaining(["email", "password"]));
    expect(CreateUserRequest.additionalProperties).toBe(false);
  });

  it("GET /api/docs/ serve a interface do Swagger UI", async () => {
    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.text).toContain("swagger-ui");
  });
});
