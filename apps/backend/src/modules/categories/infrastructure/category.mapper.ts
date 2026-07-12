import { Category as PrismaCategory } from "@autism-connect/database";
import { Category } from "../domain/category.entity";

export class CategoryMapper {
  static toDomain(record: PrismaCategory): Category {
    return new Category(
      record.id,
      record.title,
      record.icon,
      record.color,
      record.order,
      record.isSystem,
      record.isPrimary,
      record.isHiddenFromNav,
      record.phraseForm,
      record.sentenceTemplate,
      record.createdAt,
    );
  }
}
