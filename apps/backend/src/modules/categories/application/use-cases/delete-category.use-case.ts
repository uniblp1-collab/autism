import { Inject, Injectable } from "@nestjs/common";
import { CATEGORY_REPOSITORY, CategoryRepository } from "../../domain/category.repository";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { SystemCategoryProtectedException } from "../../domain/category-protected.exception";

@Injectable()
export class DeleteCategoryUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException("Category", id);
    }
    if (category.isSystem) {
      throw new SystemCategoryProtectedException(id);
    }
    await this.categoryRepository.softDelete(id);
  }
}
