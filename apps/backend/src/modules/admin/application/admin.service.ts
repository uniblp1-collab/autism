import { Injectable } from "@nestjs/common";
import { User } from "../../auth/domain/user.entity";
import { Card } from "../../cards/domain/card.entity";
import { ListUsersUseCase, PaginatedUsers } from "./use-cases/list-users.use-case";
import { SetUserActiveUseCase } from "./use-cases/set-user-active.use-case";
import { ResetUserPasswordUseCase, ResetPasswordResult } from "./use-cases/reset-user-password.use-case";
import { UploadCardImageUseCase } from "./use-cases/upload-card-image.use-case";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly setUserActiveUseCase: SetUserActiveUseCase,
    private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase,
    private readonly uploadCardImageUseCase: UploadCardImageUseCase,
  ) {}

  listUsers(query: ListUsersQueryDto): Promise<PaginatedUsers> {
    return this.listUsersUseCase.execute(query);
  }

  setUserActive(userId: string, isActive: boolean): Promise<User> {
    return this.setUserActiveUseCase.execute(userId, isActive);
  }

  resetUserPassword(userId: string): Promise<ResetPasswordResult> {
    return this.resetUserPasswordUseCase.execute(userId);
  }

  uploadCardImage(cardId: string, file: Express.Multer.File | undefined): Promise<Card> {
    return this.uploadCardImageUseCase.execute(cardId, file);
  }
}
