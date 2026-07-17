import { Card as PrismaCard } from "@autism-connect/database";
import { Card } from "../domain/card.entity";

// Приводим URL картинки к относительному пути того же origin (/uploads/cards/...). Новые
// загрузки уже относительные (StorageService), но в БД могут остаться старые абсолютные URL
// с PUBLIC_BASE_URL (http://localhost:3001/uploads/...) — они ломались снаружи (мобильный/
// туннель). Отрезаем схему+хост до маркера /uploads/, чтобы и старые записи отдавались как
// относительные и грузились через тот же origin (Next.js проксирует /uploads на backend).
function toRelativeImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return imageUrl;
  const marker = "/uploads/";
  const index = imageUrl.indexOf(marker);
  return index > 0 ? imageUrl.slice(index) : imageUrl;
}

export class CardsMapper {
  static toDomain(record: PrismaCard): Card {
    return new Card(
      record.id,
      record.categoryId,
      record.childId,
      record.title,
      toRelativeImageUrl(record.imageUrl),
      record.color,
      record.priority,
      record.ttsText,
      record.ttsPhrase,
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
    );
  }
}
