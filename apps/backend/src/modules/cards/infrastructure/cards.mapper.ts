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
      record.phraseForm,
      record.cardType,
      record.gender,
      record.phraseFormMasculine,
      record.phraseFormFeminine,
      record.phraseFormNeuter,
      record.source,
      record.isCustom,
      record.isSystemCard,
      record.createdAt,
      record.updatedAt,
      record.width,
      record.height,
    );
  }
}
