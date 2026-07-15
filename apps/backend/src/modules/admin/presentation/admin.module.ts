import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "../application/admin.service";
import { ListUsersUseCase } from "../application/use-cases/list-users.use-case";
import { SetUserActiveUseCase } from "../application/use-cases/set-user-active.use-case";
import { ResetUserPasswordUseCase } from "../application/use-cases/reset-user-password.use-case";
import { CreateParentUserUseCase } from "../application/use-cases/create-parent-user.use-case";
import { AuthModule } from "../../auth/presentation/auth.module";
import { CardsModule } from "../../cards/presentation/cards.module";

// UploadCardImageUseCase больше не создаётся здесь — теперь это провайдер CardsModule
// (загрузка картинки — логика домена карточек, а не админки), AdminModule лишь переиспользует
// экспортированный инстанс через DI.
@Module({
  imports: [AuthModule, CardsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    ListUsersUseCase,
    SetUserActiveUseCase,
    ResetUserPasswordUseCase,
    CreateParentUserUseCase,
  ],
})
export class AdminModule {}
