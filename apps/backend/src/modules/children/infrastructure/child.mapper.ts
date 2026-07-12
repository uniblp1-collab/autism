import { Child as PrismaChild, ChildFavoriteCategory } from "@autism-connect/database";
import { Child } from "../domain/child.entity";

type ChildWithFavorites = PrismaChild & { favoriteCategories?: ChildFavoriteCategory[] };

export class ChildMapper {
  static toDomain(record: ChildWithFavorites): Child {
    return new Child(
      record.id,
      record.userId,
      record.name,
      record.age,
      record.photoUrl,
      record.speechLevel,
      (record.favoriteCategories ?? []).map((fc) => fc.categoryId),
      record.difficultyLevel as 1 | 2 | 3,
      record.unlockedCategoryIds,
      record.createdAt,
      record.updatedAt,
    );
  }
}
