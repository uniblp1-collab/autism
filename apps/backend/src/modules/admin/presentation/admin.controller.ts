import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AdminService } from "../application/admin.service";
import { UpdateUserStatusDto } from "../application/dto/update-user-status.dto";
import { ListUsersQueryDto } from "../application/dto/list-users-query.dto";
import { User } from "../../auth/domain/user.entity";
import { Card } from "../../cards/domain/card.entity";

interface AdminUserResponse {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

function toUserResponse(user: User): AdminUserResponse {
  return { id: user.id, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt };
}

// Область B техзадания: только (1) загрузка/замена картинки карточки, (2) список
// родительских аккаунтов + блокировка/разблокировка, (3) доступ строго для role=ADMIN.
// Полный CRUD категорий/карточек, биллинг, сквозная аналитика — вне scope.
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  async listUsers(@Query() query: ListUsersQueryDto) {
    const result = await this.adminService.listUsers(query);
    return { ...result, items: result.items.map(toUserResponse) };
  }

  @Patch("users/:id/status")
  async setUserStatus(@Param("id") id: string, @Body() dto: UpdateUserStatusDto): Promise<AdminUserResponse> {
    return toUserResponse(await this.adminService.setUserActive(id, dto.isActive));
  }

  @HttpCode(HttpStatus.OK)
  @Post("users/:id/reset-password")
  resetPassword(@Param("id") id: string) {
    return this.adminService.resetUserPassword(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post("cards/:id/image")
  @UseInterceptors(FileInterceptor("file"))
  uploadCardImage(@Param("id") id: string, @UploadedFile() file: Express.Multer.File): Promise<Card> {
    return this.adminService.uploadCardImage(id, file);
  }
}
