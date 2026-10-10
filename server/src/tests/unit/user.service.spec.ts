import { beforeEach, describe, expect, it } from "vitest";
import { UserService } from "../../app/services/user.service";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors/domain.error";
import type { AuthenticatedUser } from "../../domain/interfaces/authenticated-user.interface";
import { BlockReasonInMemoryRepository } from "../doubles/block-reason.in-memory.repository";
import { FakeHashProvider } from "../doubles/fake.hash.provider";
import { UserInMemoryRepository } from "../doubles/user.in-memory.repository";

const VALID_USER = { name: "Maria", email: "maria@exemplo.com", password: "Senha12345" };

describe("UserService", () => {
  let userRepository: UserInMemoryRepository;
  let userService: UserService;

  beforeEach(() => {
    userRepository = new UserInMemoryRepository();
    userService = new UserService(
      userRepository,
      new FakeHashProvider(),
      new BlockReasonInMemoryRepository(userRepository),
    );
  });

  describe("create", () => {
    it("cria o usuário com senha em hash e sem expor a senha", async () => {
      const user = await userService.create(VALID_USER);

      expect(user).toMatchObject({ email: VALID_USER.email, name: VALID_USER.name, role: "USER" });
      expect(user).not.toHaveProperty("password");
      expect(userRepository.users[0].password).toBe(`hashed:${VALID_USER.password}`);
    });

    it("rejeita e-mail duplicado", async () => {
      await userService.create(VALID_USER);
      await expect(userService.create(VALID_USER)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("findById", () => {
    it("permite ao usuário ver a própria conta", async () => {
      const user = await userService.create(VALID_USER);
      const requester: AuthenticatedUser = { id: user.id, role: "USER" };

      await expect(userService.findById(user.id, requester)).resolves.toMatchObject({ id: user.id });
    });

    it("impede USER de ver a conta de outro usuário", async () => {
      const user = await userService.create(VALID_USER);
      const requester: AuthenticatedUser = { id: "outro-id", role: "USER" };

      await expect(userService.findById(user.id, requester)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("lança NotFoundError quando o usuário não existe", async () => {
      const requester: AuthenticatedUser = { id: "admin-id", role: "ADMIN" };
      await expect(userService.findById("inexistente", requester)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("update", () => {
    it("impede USER de alterar o próprio perfil de acesso", async () => {
      const user = await userService.create(VALID_USER);
      const requester: AuthenticatedUser = { id: user.id, role: "USER" };

      await expect(userService.update(user.id, { role: "ADMIN" }, requester)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("faz hash da nova senha", async () => {
      const user = await userService.create(VALID_USER);
      const requester: AuthenticatedUser = { id: user.id, role: "USER" };

      await userService.update(user.id, { password: "NovaSenha123" }, requester);

      expect(userRepository.users[0].password).toBe("hashed:NovaSenha123");
    });
  });

  describe("block / unblock", () => {
    const admin: AuthenticatedUser = { id: "admin-id", role: "ADMIN" };

    it("bloqueia o usuário e registra o motivo", async () => {
      const user = await userService.create(VALID_USER);

      const blockedUser = await userService.block(user.id, { reason: "Fraude" }, admin);
      const blockReasons = await userService.findBlockReasons(user.id);

      expect(blockedUser.isBlocked).toBe(true);
      expect(blockReasons).toEqual([expect.objectContaining({ userId: user.id, reason: "Fraude" })]);
    });

    it("rejeita bloquear usuário já bloqueado", async () => {
      const user = await userService.create(VALID_USER);
      await userService.block(user.id, { reason: "Fraude" }, admin);

      await expect(userService.block(user.id, { reason: "De novo" }, admin)).rejects.toBeInstanceOf(ConflictError);
    });

    it("impede o ADMIN de bloquear a própria conta", async () => {
      await expect(userService.block(admin.id, { reason: "Teste" }, admin)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("desbloqueia mantendo o histórico de motivos", async () => {
      const user = await userService.create(VALID_USER);
      await userService.block(user.id, { reason: "Fraude" }, admin);

      const unblockedUser = await userService.unblock(user.id);

      expect(unblockedUser.isBlocked).toBe(false);
      await expect(userService.findBlockReasons(user.id)).resolves.toHaveLength(1);
    });

    it("rejeita desbloquear usuário que não está bloqueado", async () => {
      const user = await userService.create(VALID_USER);
      await expect(userService.unblock(user.id)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("update de status", () => {
    it("impede USER de alterar o próprio campo ativo", async () => {
      const user = await userService.create(VALID_USER);
      const requester: AuthenticatedUser = { id: user.id, role: "USER" };

      await expect(userService.update(user.id, { isActive: false }, requester)).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("findAll", () => {
    it("retorna dados paginados", async () => {
      await userService.create(VALID_USER);
      await userService.create({ ...VALID_USER, email: "joao@exemplo.com" });

      const result = await userService.findAll({ page: 1, pageSize: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
    });
  });
});
