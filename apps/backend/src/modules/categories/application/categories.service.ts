import { Injectable } from "@nestjs/common";
import { Category } from "../domain/category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ListCategoriesUseCase } from "./use-cases/list-categories.use-case";
import { CreateCategoryUseCase } from "./use-cases/create-category.use-case";
import { DeleteCategoryUseCase } from "./use-cases/delete-category.use-case";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  list(): Promise<Category[]> {
    return this.listCategoriesUseCase.execute();
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.createCategoryUseCase.execute(dto);
  }

  remove(id: string): Promise<void> {
    return this.deleteCategoryUseCase.execute(id);
  }
}
