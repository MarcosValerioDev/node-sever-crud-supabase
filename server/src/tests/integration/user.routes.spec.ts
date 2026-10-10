import type { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { JwtTokenProvider } from "../../infrastructure/providers/token.provider";
import { createApp } from "../../main/app";
import { HTTP_STATUS } from "../../shared/constants/http-status";
import { BlockReasonInMemoryRepository } from "../doubles/block-reason.in-memory.repository";
import { FakeHashProvider } from "../doubles/fake.hash.provider";
import { UserInMemoryRepository } from "../doubles/user.in-memory.repository";

const ADMIN_CREDENTIALS = { email: "admin@exemplo.com", password: "Admin12345" };
const USER_CREDENTIALS = { email: "maria@exemplo.com", password: "Senha12345" };

describe("Rotas de usuário e autenticação", () => {
  let app: Express;
  let userRepository: UserInMemoryRepository;

  const signIn = async (credentials: { email: string; password: string }): Promise<string> => {
    const response = await request(app).post("/api/auth/signin").send(credentials);
    return response.body.accessToken;
  };

  beforeEach(async () => {
    userRepository = new UserInMemoryRepository();
    const hashProvider = new FakeHashProvider();

    app = createApp({
      userRepository,
      blockReasonRepository: new BlockReasonInMemoryRepository(userRepository),
      hashProvider,
      tokenProvider: new JwtTokenProvider(process.env.JWT_SECRET!, "1h"),
    });

    await userRepository.save({
      ...ADMIN_CREDENTIALS,
      name: "Admin",
      password: await hashProvider.hash(ADMIN_CREDENTIALS.password),
      role: "ADMIN",
    });
  });

  it("POST /api/users cria usuário público com role USER (ignora campos extras)", async () => {
    const response = await request(app).post("/api/users").send(USER_CREDENTIALS);

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(response.body).toMatchObject({ email: USER_CREDENTIALS.email, role: "USER" });
    expect(response.body).not.toHaveProperty("password");
  });

  it("POST /api/users rejeita tentativa de se cadastrar como ADMIN", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ ...USER_CREDENTIALS, role: "ADMIN" });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it("POST /api/users retorna 400 com detalhes de validação", async () => {
    const response = await request(app).post("/api/users").send({ email: "invalido", password: "123" });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(response.body.error.code).toBe("VALIDATION");
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it("POST /api/auth/signin retorna token com credenciais válidas e 401 com inválidas", async () => {
    const valid = await request(app).post("/api/auth/signin").send(ADMIN_CREDENTIALS);
    const invalid = await request(app)
      .post("/api/auth/signin")
      .send({ ...ADMIN_CREDENTIALS, password: "errada123" });

    expect(valid.status).toBe(HTTP_STATUS.OK);
    expect(valid.body.accessToken).toEqual(expect.any(String));
    expect(invalid.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("rotas privadas exigem token", async () => {
    const response = await request(app).get("/api/users");
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("GET /api/users é exclusivo de ADMIN", async () => {
    await request(app).post("/api/users").send(USER_CREDENTIALS);

    const userToken = await signIn(USER_CREDENTIALS);
    const adminToken = await signIn(ADMIN_CREDENTIALS);

    const asUser = await request(app).get("/api/users").set("Authorization", `Bearer ${userToken}`);
    const asAdmin = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);

    expect(asUser.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(asAdmin.status).toBe(HTTP_STATUS.OK);
    expect(asAdmin.body.meta.total).toBe(2);
  });

  it("POST /api/auth/signup permite ADMIN criar outro ADMIN", async () => {
    const adminToken = await signIn(ADMIN_CREDENTIALS);

    const response = await request(app)
      .post("/api/auth/signup")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...USER_CREDENTIALS, role: "ADMIN" });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(response.body.role).toBe("ADMIN");
  });

  it("usuário atualiza e exclui a própria conta", async () => {
    const created = await request(app).post("/api/users").send(USER_CREDENTIALS);
    const userToken = await signIn(USER_CREDENTIALS);

    const updated = await request(app)
      .patch(`/api/users/${created.body.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Maria Silva" });

    const deleted = await request(app)
      .delete(`/api/users/${created.body.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(updated.status).toBe(HTTP_STATUS.OK);
    expect(updated.body.name).toBe("Maria Silva");
    expect(deleted.status).toBe(HTTP_STATUS.NO_CONTENT);
  });

  it("ADMIN bloqueia usuário: login e token existente passam a ser recusados; desbloqueio restaura acesso", async () => {
    const created = await request(app).post("/api/users").send(USER_CREDENTIALS);
    const userToken = await signIn(USER_CREDENTIALS);
    const adminToken = await signIn(ADMIN_CREDENTIALS);
    const asAdmin = { Authorization: `Bearer ${adminToken}` };

    const blocked = await request(app)
      .patch(`/api/users/${created.body.id}/block`)
      .set(asAdmin)
      .send({ reason: "Uso indevido da plataforma" });
    expect(blocked.status).toBe(HTTP_STATUS.OK);
    expect(blocked.body.isBlocked).toBe(true);

    const oldTokenRequest = await request(app)
      .get(`/api/users/${created.body.id}`)
      .set("Authorization", `Bearer ${userToken}`);
    const signInWhileBlocked = await request(app).post("/api/auth/signin").send(USER_CREDENTIALS);
    expect(oldTokenRequest.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(signInWhileBlocked.status).toBe(HTTP_STATUS.FORBIDDEN);

    const reasons = await request(app).get(`/api/users/${created.body.id}/block-reasons`).set(asAdmin);
    expect(reasons.status).toBe(HTTP_STATUS.OK);
    expect(reasons.body[0].reason).toBe("Uso indevido da plataforma");

    const unblocked = await request(app).patch(`/api/users/${created.body.id}/unblock`).set(asAdmin);
    expect(unblocked.status).toBe(HTTP_STATUS.OK);
    expect(unblocked.body.isBlocked).toBe(false);

    const signInAfterUnblock = await request(app).post("/api/auth/signin").send(USER_CREDENTIALS);
    expect(signInAfterUnblock.status).toBe(HTTP_STATUS.OK);
  });

  it("bloquear exige motivo e é exclusivo de ADMIN", async () => {
    const created = await request(app).post("/api/users").send(USER_CREDENTIALS);
    const userToken = await signIn(USER_CREDENTIALS);
    const adminToken = await signIn(ADMIN_CREDENTIALS);

    const withoutReason = await request(app)
      .patch(`/api/users/${created.body.id}/block`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    const asUser = await request(app)
      .patch(`/api/users/${created.body.id}/block`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "Qualquer" });

    expect(withoutReason.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(asUser.status).toBe(HTTP_STATUS.FORBIDDEN);
  });

  it("usuário inativo não consegue fazer login", async () => {
    const created = await request(app).post("/api/users").send(USER_CREDENTIALS);
    const adminToken = await signIn(ADMIN_CREDENTIALS);

    await request(app)
      .patch(`/api/users/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });

    const response = await request(app).post("/api/auth/signin").send(USER_CREDENTIALS);
    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
  });

  it("retorna 404 para rota inexistente", async () => {
    const response = await request(app).get("/api/nao-existe");
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });
});
