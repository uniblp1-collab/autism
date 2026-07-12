import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, UserRepository } from "../../../auth/domain/user.repository";
import { User } from "../../../auth/domain/user.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { OnlyParentAccountsManageableException } from "../only-parent-accounts.exception";

@Injectable()
export class SetUserActiveUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(userId: string, isActive: boolean): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException("User", userId);
    }
    if (user.role !== "PARENT") {
      throw new OnlyParentAccountsManageableException();
    }

    return this.userRepository.setActive(userId, isActive);
  }
}
