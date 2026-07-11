import { Inject, Injectable } from "@nestjs/common";
import { CATEGORY_REPOSITORY, CategoryRepository } from "../../domain/category.repository";
import { Category } from "../../domain/category.entity";
import { CreateCategoryDto } from "../dto/create-category.dto";

@Injectable()
export class CreateCategoryUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepository) {}

  execute(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryRepository.create({
      title: dto.title,
      icon: dto.icon,
      color: dto.color ?? "#5F5E5A",
      order: dto.order ?? 0,
    });
  }
}
