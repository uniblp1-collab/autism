import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { FavoritesService } from "../application/favorites.service";
import { AddFavoriteDto } from "../application/dto/add-favorite.dto";
import { CurrentUser, CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Query("childId") childId: string) {
    return this.favoritesService.list(user.userId, childId);
  }

  @Post()
  add(@CurrentUser() user: CurrentUserPayload, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(user.userId, dto);
  }

  // См. комментарий в cards.controller.ts — без 204 фронтенд не может отличить
  // «пустой успешный ответ» от «нужно распарсить JSON».
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":childId/:cardId")
  remove(@CurrentUser() user: CurrentUserPayload, @Param("childId") childId: string, @Param("cardId") cardId: string) {
    return this.favoritesService.remove(user.userId, childId, cardId);
  }
}
