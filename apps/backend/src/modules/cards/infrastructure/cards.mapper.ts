import { Card as PrismaCard } from "@autism-connect/database";
import { Card } from "../domain/card.entity";

export class CardsMapper {
  static toDomain(record: PrismaCard): Card {
    return new Card(
      record.id,
      record.categoryId,
      record.childId,
      record.title,
      record.imageUrl,
      record.color,
      record.priority,
      record.ttsText,
      record.source,
      record.isCustom,
      record.createdAt,
      record.updatedAt,
    );
  }
}
