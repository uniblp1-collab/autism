import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "../application/admin.service";
import { ListUsersUseCase } from "../application/use-cases/list-users.use-case";
import { SetUserActiveUseCase } from "../application/use-cases/set-user-active.use-case";
import { ResetUserPasswordUseCase } from "../application/use-cases/reset-user-password.use-case";
import { UploadCardImageUseCase } from "../application/use-cases/upload-card-image.use-case";
import { AuthModule } from "../../auth/presentation/auth.module";
import { CardsModule } from "../../cards/presentation/cards.module";
import { StorageModule } from "../../../storage/storage.module";

@Module({
  imports: [AuthModule, CardsModule, StorageModule],
  controllers: [AdminController],
  providers: [AdminService, ListUsersUseCase, SetUserActiveUseCase, ResetUserPasswordUseCase, UploadCardImageUseCase],
})
export class AdminModule {}
