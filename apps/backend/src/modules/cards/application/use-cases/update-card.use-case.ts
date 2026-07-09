import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { UpdateCardDto } from "../dto/update-card.dto";
import { GetCardUseCase } from "./get-card.use-case";

@Injectable()
export class UpdateCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly getCardUseCase: GetCardUseCase,
  ) {}

  async execute(id: string, dto: UpdateCardDto): Promise<Card> {
    await this.getCardUseCase.execute(id);
    return this.cardRepository.update(id, dto);
  }
}
