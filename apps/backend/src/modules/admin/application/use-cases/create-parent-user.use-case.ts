import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, UserRepository } from "../../../auth/domain/user.repository";
import { PASSWORD_HASHER, PasswordHasherPort } from "../../../auth/domain/password-hasher.port";
import { EmailAlreadyRegisteredException } from "../../../auth/domain/invalid-credentials.exception";
import { User } from "../../../auth/domain/user.entity";
import { generateTemporaryPassword } from "../generate-temporary-password";

export interface CreateParentResult {
  user: User;
  temporaryPassword: string;
}

// Дополняет Part B (раньше — только блокировка/разблокировка существующих аккаунтов, см.
// set-user-active.use-case.ts) — теперь админ может завести родительский аккаунт напрямую
// (TASK_PATCH_3 §5). Роль всегда PARENT — создание других ADMIN через эту ручку не входит в
// задачу (при необходимости — отдельная, более защищённая операция). Временный пароль — то же
// осознанное упрощение MVP, что и в ResetUserPasswordUseCase: без email-канала, возвращается
// в ответе API один раз.
@Injectable()
export class CreateParentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(email: string): Promise<CreateParentResult> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredException(email);
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    const user = await this.userRepository.create({ email, passwordHash, role: "PARENT" });

    return { user, temporaryPassword };
  }
}
