import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

@Injectable()
export class GetCardUseCase {
  constructor(@Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository) {}

  async execute(id: string): Promise<Card> {
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new EntityNotFoundException("Card", id);
    }
    return card;
  }
}
