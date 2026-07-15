import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { StorageService } from "../../../../storage/storage.service";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class UploadCardImageUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly storageService: StorageService,
    private readonly childAccessService: ChildAccessService,
  ) {}

  // userId не задан — вызов из AdminModule (role=ADMIN управляет любыми карточками без
  // привязки к конкретному ребёнку, см. CLAUDE.md §область B). Если задан — вызов из
  // CardsController (режим редактирования на экране ребёнка) — для кастомной карточки
  // (childId задан) проверяем, что её владелец действительно этот пользователь.
  async execute(cardId: string, file: Express.Multer.File | undefined, userId?: string): Promise<Card> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new EntityNotFoundException("Card", cardId);
    }
    if (userId && card.childId) {
      await this.childAccessService.assertOwnedByUser(card.childId, userId);
    }

    const imageUrl = await this.storageService.uploadCardImage(file);
    const updated = await this.cardRepository.update(cardId, { imageUrl });
    // Замена картинки — удаляем старый файл с диска ПОСЛЕ успешной записи новой карточки,
    // чтобы неудачный upload/update никогда не оставлял карточку без картинки вовсе.
    await this.storageService.deleteCardImage(card.imageUrl);
    return updated;
  }
}
