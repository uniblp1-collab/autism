import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { CannotDeleteCardException } from "../../domain/cannot-delete-card.exception";
import { GetCardUseCase } from "./get-card.use-case";

@Injectable()
export class DeleteCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly getCardUseCase: GetCardUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    const card = await this.getCardUseCase.execute(id);
    if (!card.isCustom || card.isSystemCard) {
      throw new CannotDeleteCardException();
    }
    await this.cardRepository.softDelete(id);
  }
}
