import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { GetCardUseCase } from "./get-card.use-case";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class PromoteCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly getCardUseCase: GetCardUseCase,
    private readonly childAccessService: ChildAccessService,
  ) {}

  /**
   * "Поставить карточку на первое место" в разделе (по запросу заказчика): пересчитывает
   * priority у всех карточек того же раздела и типа, которые реально показываются вместе
   * ребёнку (библиотечные + кастомные карточки этого childId, см. useCards({ includeCustom:
   * true }) на экране ребёнка) — целевая карточка получает наибольший priority, остальные
   * сохраняют взаимный порядок. Сортировка — PrismaCardRepository.search (priority desc).
   */
  async execute(userId: string, cardId: string, childId: string): Promise<Card> {
    await this.childAccessService.assertOwnedByUser(childId, userId);
    const target = await this.getCardUseCase.execute(cardId);

    const siblings = await this.cardRepository.search({
      categoryId: target.categoryId,
      childId,
      includeCustom: true,
      cardType: target.cardType,
    });

    const others = siblings.filter((card) => card.id !== target.id);
    const ordered = [target, ...others];
    const updates = ordered.map((card, index) => ({
      id: card.id,
      priority: ordered.length - index,
    }));

    await this.cardRepository.updatePriorities(updates);
    return this.getCardUseCase.execute(cardId);
  }
}
