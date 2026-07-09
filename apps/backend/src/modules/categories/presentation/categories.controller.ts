import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CategoriesService } from "../application/categories.service";
import { CreateCategoryDto } from "../application/dto/create-category.dto";

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

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
