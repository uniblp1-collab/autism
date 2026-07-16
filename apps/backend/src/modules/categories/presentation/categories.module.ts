import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "../application/categories.service";
import { ListCategoriesUseCase } from "../application/use-cases/list-categories.use-case";
import { CreateCategoryUseCase } from "../application/use-cases/create-category.use-case";
import { UpdateCategoryUseCase } from "../application/use-cases/update-category.use-case";
import { DeleteCategoryUseCase } from "../application/use-cases/delete-category.use-case";
import { CATEGORY_REPOSITORY } from "../domain/category.repository";
import { PrismaCategoryRepository } from "../infrastructure/prisma-category.repository";

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
