import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RegisterUseCase } from "./use-cases/register.use-case";
import { LoginUseCase } from "./use-cases/login.use-case";
import { RefreshTokenUseCase } from "./use-cases/refresh-token.use-case";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { User } from "../domain/user.entity";

export interface AuthenticatedResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthenticatedResult> {
    const user = await this.registerUseCase.execute(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthenticatedResult> {
    const user = await this.loginUseCase.execute(dto);
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthenticatedResult> {
    const user = await this.refreshTokenUseCase.execute(refreshToken);
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthenticatedResult> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret"),
        expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d"),
      }),
    ]);

    return { user, accessToken, refreshToken };
  }
}
