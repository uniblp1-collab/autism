import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { CannotDeleteCardException } from "../../domain/cannot-delete-card.exception";
import { GetCardUseCase } from "./get-card.use-case";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class DeleteCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly getCardUseCase: GetCardUseCase,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const card = await this.getCardUseCase.execute(id);
    // Родитель может удалять и редактировать библиотечные (не только кастомные) карточки
    // из режима редактирования — явное продуктовое решение. Защищены только Да/Нет
    // (isSystemCard) — они структурно обязательны для механики, а не обычный контент.
    if (card.isSystemCard) {
      throw new CannotDeleteCardException();
    }
    // Кастомная карточка (childId задан) — удалить может только родитель, которому
    // принадлежит этот ребёнок, а не любой авторизованный пользователь.
    if (card.childId) {
      await this.childAccessService.assertOwnedByUser(card.childId, userId);
    }
    await this.cardRepository.softDelete(id);
  }
}
