import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { USER_REPOSITORY, UserRepository } from "../../domain/user.repository";
import { User } from "../../domain/user.entity";

interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(refreshToken: string): Promise<User> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret"),
      });
    } catch {
      throw new UnauthorizedException("Недействительный refresh-токен");
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Аккаунт заблокирован администратором");
    }

    return user;
  }
}
