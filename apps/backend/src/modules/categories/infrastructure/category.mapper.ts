import { Category as PrismaCategory } from "@autism-connect/database";
import { Category } from "../domain/category.entity";

export class CategoryMapper {
  static toDomain(record: PrismaCategory): Category {
    return new Category(record.id, record.title, record.icon, record.order, record.isSystem, record.createdAt);
  }
}
