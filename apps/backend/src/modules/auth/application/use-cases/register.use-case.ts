import { Inject, Injectable } from "@nestjs/common";
import { PASSWORD_HASHER, PasswordHasherPort } from "../../domain/password-hasher.port";
import { USER_REPOSITORY, UserRepository } from "../../domain/user.repository";
import { User } from "../../domain/user.entity";
import { EmailAlreadyRegisteredException } from "../../domain/invalid-credentials.exception";
import { RegisterDto } from "../dto/register.dto";

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyRegisteredException(dto.email);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    return this.userRepository.create({ email: dto.email, passwordHash, role: "PARENT" });
  }
}
