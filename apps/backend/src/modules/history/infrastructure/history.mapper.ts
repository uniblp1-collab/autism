import { History as PrismaHistory, HistoryItem as PrismaHistoryItem } from "@autism-connect/database";
import { HistoryEntry } from "../domain/history-entry.entity";

type HistoryWithItems = PrismaHistory & { items: PrismaHistoryItem[] };

export class HistoryMapper {
  static toDomain(record: HistoryWithItems): HistoryEntry {
    const cardIds = [...record.items].sort((a, b) => a.position - b.position).map((item) => item.cardId);
    return new HistoryEntry(record.id, record.childId, record.sentenceText, cardIds, record.createdAt);
  }
}
