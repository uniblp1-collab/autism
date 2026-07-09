import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { FavoritesService } from "../application/favorites.service";
import { AddFavoriteDto } from "../application/dto/add-favorite.dto";

@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@Query("childId") childId: string) {
    return this.favoritesService.list(childId);
  }

  @Post()
  add(@Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(dto);
  }

  @Delete(":childId/:cardId")
  remove(@Param("childId") childId: string, @Param("cardId") cardId: string) {
    return this.favoritesService.remove(childId, cardId);
  }
}
