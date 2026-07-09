import { Inject, Injectable } from "@nestjs/common";
import { CATEGORY_REPOSITORY, CategoryRepository } from "../../domain/category.repository";
import { Category } from "../../domain/category.entity";

@Injectable()
export class ListCategoriesUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepository) {}

  execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}
