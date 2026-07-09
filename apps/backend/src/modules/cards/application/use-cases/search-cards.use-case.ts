import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { SearchCardsDto } from "../dto/search-cards.dto";

@Injectable()
export class SearchCardsUseCase {
  constructor(@Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository) {}

  execute(dto: SearchCardsDto): Promise<Card[]> {
    return this.cardRepository.search({
      categoryId: dto.categoryId,
      childId: dto.childId,
      query: dto.query,
      includeCustom: dto.includeCustom,
    });
  }
}
