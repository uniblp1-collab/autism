import { Inject, Injectable } from "@nestjs/common";
import {
  HISTORY_REPOSITORY,
  HistoryRepository,
  MAX_HISTORY_ENTRIES_PER_CHILD,
} from "../../domain/history.repository";
import { HistoryEntry } from "../../domain/history-entry.entity";

@Injectable()
export class ListHistoryUseCase {
  constructor(@Inject(HISTORY_REPOSITORY) private readonly historyRepository: HistoryRepository) {}

  execute(childId: string): Promise<HistoryEntry[]> {
    return this.historyRepository.findRecentByChild(childId, MAX_HISTORY_ENTRIES_PER_CHILD);
  }
}
