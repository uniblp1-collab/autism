import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, UserRepository } from "../../../auth/domain/user.repository";
import { PASSWORD_HASHER, PasswordHasherPort } from "../../../auth/domain/password-hasher.port";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { OnlyParentAccountsManageableException } from "../only-parent-accounts.exception";
import { generateTemporaryPassword } from "../generate-temporary-password";

export interface ResetPasswordResult {
  userId: string;
  temporaryPassword: string;
}

@Injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(userId: string): Promise<ResetPasswordResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException("User", userId);
    }
    if (user.role !== "PARENT") {
      throw new OnlyParentAccountsManageableException();
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    await this.userRepository.setPasswordHash(userId, passwordHash);

    return { userId, temporaryPassword };
  }
}
