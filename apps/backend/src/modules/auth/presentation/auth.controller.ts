import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Public } from "../../../common/decorators/public.decorator";
import { AuthService, AuthenticatedResult } from "../application/auth.service";
import { RegisterDto } from "../application/dto/register.dto";
import { LoginDto } from "../application/dto/login.dto";
import { RefreshTokenDto } from "../application/dto/refresh-token.dto";

interface AuthResponse {
  user: { id: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
}

function toResponse(result: AuthenticatedResult): AuthResponse {
  return {
    user: { id: result.user.id, email: result.user.email, role: result.user.role },
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return toResponse(await this.authService.register(dto));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return toResponse(await this.authService.login(dto));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return toResponse(await this.authService.refresh(dto.refreshToken));
  }
}
