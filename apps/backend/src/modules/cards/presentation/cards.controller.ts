import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { CardsService } from "../application/cards.service";
import { CreateCardDto } from "../application/dto/create-card.dto";
import { UpdateCardDto } from "../application/dto/update-card.dto";
import { SearchCardsDto } from "../application/dto/search-cards.dto";

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
  create(@Body() dto: CreateCardDto) {
    return this.cardsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(id, dto);
  }

  // Без явного 204 Nest по умолчанию отдаёт 200 с пустым телом на DELETE — фронтенд
  // (apiFetch) ждёт ровно 204, чтобы не пытаться распарсить пустое тело как JSON.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.cardsService.remove(id);
  }
}
