import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { UpdateCardDto } from "../dto/update-card.dto";
import { GetCardUseCase } from "./get-card.use-case";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class UpdateCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly getCardUseCase: GetCardUseCase,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async execute(userId: string, id: string, dto: UpdateCardDto): Promise<Card> {
    const card = await this.getCardUseCase.execute(id);
    // Библиотечные карточки (childId === null) редактирует любой родитель — явное продуктовое
    // решение (см. cards.controller.ts). Кастомные карточки (childId задан) принадлежат
    // конкретному ребёнку — их может менять только родитель, которому этот ребёнок принадлежит.
    if (card.childId) {
      await this.childAccessService.assertOwnedByUser(card.childId, userId);
    }
    return this.cardRepository.update(id, dto);
  }
}
