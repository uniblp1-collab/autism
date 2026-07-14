import {
  Body,
  Controller,
  Delete,
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
import { CardsService } from "../application/cards.service";
import { CreateCardDto } from "../application/dto/create-card.dto";
import { UpdateCardDto } from "../application/dto/update-card.dto";
import { SearchCardsDto } from "../application/dto/search-cards.dto";
import { Card } from "../domain/card.entity";
import { CurrentUser, CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Controller("cards")
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  search(@Query() query: SearchCardsDto) {
    return this.cardsService.search(query);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.cardsService.getOne(id);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateCardDto) {
    return this.cardsService.create(user.userId, dto);
  }

  // Без @Roles, как и remove/uploadImage ниже: любой авторизованный родитель может
  // редактировать библиотечные карточки (childId === null, продуктовое решение), но
  // кастомную карточку (childId задан) — только владелец соответствующего ребёнка
  // (проверяется в UpdateCardUseCase).
  @Patch(":id")
  update(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(user.userId, id, dto);
  }

  // Без явного 204 Nest по умолчанию отдаёт 200 с пустым телом на DELETE — фронтенд
  // (apiFetch) ждёт ровно 204, чтобы не пытаться распарсить пустое тело как JSON.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.cardsService.remove(user.userId, id);
  }

  // Доступна из режима редактирования на экране ребёнка (карандаш) — то же разграничение
  // библиотечных/кастомных карточек, что и в update/remove выше (см. UploadCardImageUseCase).
  @HttpCode(HttpStatus.OK)
  @Post(":id/image")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Card> {
    return this.cardsService.uploadImage(user.userId, id, file);
  }
}
