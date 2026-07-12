import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../../cards/domain/card.repository";
import { Card } from "../../../cards/domain/card.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { StorageService } from "../../../../storage/storage.service";

@Injectable()
export class UploadCardImageUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(cardId: string, file: Express.Multer.File | undefined): Promise<Card> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new EntityNotFoundException("Card", cardId);
    }

    const imageUrl = await this.storageService.uploadCardImage(file);
    return this.cardRepository.update(cardId, { imageUrl });
  }
}
