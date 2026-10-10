import { ForbiddenError, UnauthorizedError } from "../../domain/errors/domain.error";
import type { IHashProvider } from "../../domain/interfaces/hash.provider.interface";
import type { ITokenProvider } from "../../domain/interfaces/token.provider.interface";
import type { IUserRepository } from "../../domain/interfaces/user.repository.interface";
import type { AuthResponseDto, SignInDto, SignUpDto } from "../dtos/auth.dto";
import type { UserResponseDto } from "../dtos/user.dto";
import { UserMapper } from "../mappers/user.mapper";
import type { UserService } from "./user.service";

const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos";

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly tokenProvider: ITokenProvider,
    private readonly userService: UserService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(signInDto.email);
    if (!user) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

    const isPasswordValid = await this.hashProvider.compare(signInDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

    // Só revela o status da conta para quem já provou conhecer a senha.
    if (user.isBlocked) throw new ForbiddenError("Usuário bloqueado. Procure um administrador");
    if (!user.isActive) throw new ForbiddenError("Usuário inativo. Procure um administrador");

    return {
      accessToken: this.tokenProvider.sign({ sub: user.id, role: user.role }),
      tokenType: "Bearer",
      user: UserMapper.toResponse(user),
    };
  }

  /** Cadastro feito por um ADMIN, que pode definir o perfil de acesso. */
  signUp(signUpDto: SignUpDto): Promise<UserResponseDto> {
    return this.userService.create(signUpDto);
  }
}
