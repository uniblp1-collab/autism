import { Category } from "./category.entity";

export const CATEGORY_REPOSITORY = Symbol("CATEGORY_REPOSITORY");

export interface CreateCategoryData {
  title: string;
  icon: string;
  color: string;
  order: number;
  isPrimary?: boolean;
  isHiddenFromNav?: boolean;
  phraseForm?: string;
  sentenceTemplate?: string;
}

export interface CategoryRepository {
  /** По умолчанию не возвращает служебные категории (isHiddenFromNav) — они не показываются пилюлями. */
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(data: CreateCategoryData): Promise<Category>;
  softDelete(id: string): Promise<void>;
}
