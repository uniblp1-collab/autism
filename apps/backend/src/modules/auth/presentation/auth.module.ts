import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "../application/auth.service";
import { RegisterUseCase } from "../application/use-cases/register.use-case";
import { LoginUseCase } from "../application/use-cases/login.use-case";
import { RefreshTokenUseCase } from "../application/use-cases/refresh-token.use-case";
import { USER_REPOSITORY } from "../domain/user.repository";
import { PrismaUserRepository } from "../infrastructure/prisma-user.repository";
import { PASSWORD_HASHER } from "../domain/password-hasher.port";
import { BcryptPasswordHasher } from "../infrastructure/bcrypt-password-hasher";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthModule {}
