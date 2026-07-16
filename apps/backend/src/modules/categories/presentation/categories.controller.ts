import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { CategoriesService } from "../application/categories.service";
import { CreateCategoryDto } from "../application/dto/create-category.dto";
import { UpdateCategoryDto } from "../application/dto/update-category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list() {
    return this.categoriesService.list();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // Редактирование раздела (озвучка/название) из режима редактирования на экране ребёнка.
  // Разрешено и для системных категорий — в отличие от удаления (см. update-category.use-case.ts).
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  // См. комментарий в cards.controller.ts — без 204 фронтенд не может отличить
  // «пустой успешный ответ» от «нужно распарсить JSON».
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
