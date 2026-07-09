import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { GetCardUseCase } from "./get-card.use-case";

@Injectable()
export class DeleteCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly getCardUseCase: GetCardUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    await this.getCardUseCase.execute(id);
    await this.cardRepository.softDelete(id);
  }
}
