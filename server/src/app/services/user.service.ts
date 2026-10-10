import type { UserEntity } from "../../domain/entities/user.entity";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors/domain.error";
import type { IBlockReasonRepository } from "../../domain/interfaces/block-reason.repository.interface";
import type { AuthenticatedUser } from "../../domain/interfaces/authenticated-user.interface";
import type { IHashProvider } from "../../domain/interfaces/hash.provider.interface";
import type { IUserRepository, UpdateUserData } from "../../domain/interfaces/user.repository.interface";
import { buildPaginationMeta, toSkipTake } from "../../shared/utils/pagination.util";
import type {
  BlockReasonResponseDto,
  BlockUserDto,
  CreateUserDto,
  ListUsersQueryDto,
  PaginatedResponseDto,
  UpdateUserDto,
  UserResponseDto,
} from "../dtos/user.dto";
import { BlockReasonMapper } from "../mappers/block-reason.mapper";
import { UserMapper } from "../mappers/user.mapper";

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly blockReasonRepository: IBlockReasonRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.ensureEmailIsAvailable(createUserDto.email);

    const user = await this.userRepository.save({
      email: createUserDto.email,
      name: createUserDto.name ?? null,
      password: await this.hashProvider.hash(createUserDto.password),
      role: createUserDto.role ?? "USER",
    });

    return UserMapper.toResponse(user);
  }

  async findById(id: string, requester: AuthenticatedUser): Promise<UserResponseDto> {
    this.ensureCanManageUser(id, requester);
    const user = await this.getExistingUser(id);
    return UserMapper.toResponse(user);
  }

  async findAll(listUsersQueryDto: ListUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { users, total } = await this.userRepository.findAll(toSkipTake(listUsersQueryDto));

    return {
      data: UserMapper.toResponseList(users),
      meta: buildPaginationMeta(listUsersQueryDto, total),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto, requester: AuthenticatedUser): Promise<UserResponseDto> {
    this.ensureCanManageUser(id, requester);

    if ((updateUserDto.role !== undefined || updateUserDto.isActive !== undefined) && requester.role !== "ADMIN") {
      throw new ForbiddenError("Apenas administradores podem alterar o perfil de acesso ou o status da conta");
    }

    const currentUser = await this.getExistingUser(id);

    if (updateUserDto.email && updateUserDto.email !== currentUser.email) {
      await this.ensureEmailIsAvailable(updateUserDto.email);
    }

    const updateUserData: UpdateUserData = {
      ...updateUserDto,
      password: updateUserDto.password ? await this.hashProvider.hash(updateUserDto.password) : undefined,
    };

    const user = await this.userRepository.update(id, updateUserData);
    return UserMapper.toResponse(user);
  }

  async delete(id: string, requester: AuthenticatedUser): Promise<void> {
    this.ensureCanManageUser(id, requester);
    await this.getExistingUser(id);
    await this.userRepository.delete(id);
  }

  async block(id: string, blockUserDto: BlockUserDto, requester: AuthenticatedUser): Promise<UserResponseDto> {
    if (id === requester.id) throw new ForbiddenError("Você não pode bloquear a própria conta");

    const user = await this.getExistingUser(id);
    if (user.isBlocked) throw new ConflictError("Usuário já está bloqueado");

    const blockedUser = await this.userRepository.block(id, blockUserDto.reason);
    return UserMapper.toResponse(blockedUser);
  }

  async unblock(id: string): Promise<UserResponseDto> {
    const user = await this.getExistingUser(id);
    if (!user.isBlocked) throw new ConflictError("Usuário não está bloqueado");

    const unblockedUser = await this.userRepository.unblock(id);
    return UserMapper.toResponse(unblockedUser);
  }

  async findBlockReasons(id: string): Promise<BlockReasonResponseDto[]> {
    await this.getExistingUser(id);
    const blockReasons = await this.blockReasonRepository.findAllByUserId(id);
    return BlockReasonMapper.toResponseList(blockReasons);
  }

  private async getExistingUser(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("Usuário não encontrado");
    return user;
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new ConflictError("E-mail já cadastrado");
  }

  /** Usuário comum só gerencia a própria conta; ADMIN gerencia qualquer uma. */
  private ensureCanManageUser(targetUserId: string, requester: AuthenticatedUser): void {
    if (requester.role !== "ADMIN" && requester.id !== targetUserId) {
      throw new ForbiddenError("Você não tem permissão para acessar este usuário");
    }
  }
}
