import { Inject, Injectable } from "@nestjs/common";
import { CATEGORY_REPOSITORY, CategoryRepository } from "../../domain/category.repository";
import { Category } from "../../domain/category.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { UpdateCategoryDto } from "../dto/update-category.dto";

@Injectable()
export class UpdateCategoryUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException("Category", id);
    }
    // В отличие от удаления, редактирование системных категорий разрешено намеренно: смысл
    // фичи — дать родителю поправить озвучку/название готовых разделов ("Дай", "Идти" и т.д.),
    // все они isSystem. Структурные поля (isPrimary/isHiddenFromNav) DTO не принимает.
    return this.categoryRepository.update(id, dto);
  }
}
