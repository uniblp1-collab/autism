import { HistoryEntry } from "./history-entry.entity";

export const HISTORY_REPOSITORY = Symbol("HISTORY_REPOSITORY");

// Правило приложения (не схемы БД): храним не более 100 последних предложений на ребёнка (DATABASE.md §2.6).
export const MAX_HISTORY_ENTRIES_PER_CHILD = 100;

export interface HistoryRepository {
  create(childId: string, sentenceText: string, cardIds: string[]): Promise<HistoryEntry>;
  findRecentByChild(childId: string, limit: number): Promise<HistoryEntry[]>;
  countByChild(childId: string): Promise<number>;
  deleteOldestBeyond(childId: string, keep: number): Promise<void>;
}
