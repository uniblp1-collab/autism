import { Inject, Injectable } from "@nestjs/common";
import { PASSWORD_HASHER, PasswordHasherPort } from "../../domain/password-hasher.port";
import { USER_REPOSITORY, UserRepository } from "../../domain/user.repository";
import { User } from "../../domain/user.entity";
import { AccountBlockedException, InvalidCredentialsException } from "../../domain/invalid-credentials.exception";
import { LoginDto } from "../dto/login.dto";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(dto: LoginDto): Promise<User> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new AccountBlockedException();
    }

    return user;
  }
}
