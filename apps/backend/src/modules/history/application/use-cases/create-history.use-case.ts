import { Inject, Injectable } from "@nestjs/common";
import {
  HISTORY_REPOSITORY,
  HistoryRepository,
  MAX_HISTORY_ENTRIES_PER_CHILD,
} from "../../domain/history.repository";
import { HistoryEntry } from "../../domain/history-entry.entity";
import { CARD_REPOSITORY, CardRepository } from "../../../cards/domain/card.repository";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { CreateHistoryDto } from "../dto/create-history.dto";

@Injectable()
export class CreateHistoryUseCase {
  constructor(
    @Inject(HISTORY_REPOSITORY) private readonly historyRepository: HistoryRepository,
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
  ) {}

  async execute(dto: CreateHistoryDto): Promise<HistoryEntry> {
    const words: string[] = [];
    for (const cardId of dto.cardIds) {
      const card = await this.cardRepository.findById(cardId);
      if (!card) {
        throw new EntityNotFoundException("Card", cardId);
      }
      words.push(card.ttsText);
    }

    const sentenceText = dto.sentenceText ?? words.join(" ");
    const entry = await this.historyRepository.create(dto.childId, sentenceText, dto.cardIds);

    const total = await this.historyRepository.countByChild(dto.childId);
    if (total > MAX_HISTORY_ENTRIES_PER_CHILD) {
      await this.historyRepository.deleteOldestBeyond(dto.childId, MAX_HISTORY_ENTRIES_PER_CHILD);
    }

    return entry;
  }
}
