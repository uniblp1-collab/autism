import { Inject, Injectable } from "@nestjs/common";
import { CARD_REPOSITORY, CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { CreateCardDto } from "../dto/create-card.dto";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class CreateCardUseCase {
  constructor(
    @Inject(CARD_REPOSITORY) private readonly cardRepository: CardRepository,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async execute(userId: string, dto: CreateCardDto): Promise<Card> {
    const isCustom = Boolean(dto.childId);
    // Кастомная карточка привязывается к конкретному ребёнку — без проверки любой родитель
    // мог бы, подставив чужой childId, добавить карточку в библиотеку чужого ребёнка.
    if (dto.childId) {
      await this.childAccessService.assertOwnedByUser(dto.childId, userId);
    }
    return this.cardRepository.create({
      categoryId: dto.categoryId,
      childId: dto.childId ?? null,
      title: dto.title,
      imageUrl: dto.imageUrl ?? null,
      color: dto.color,
      priority: dto.priority,
      ttsText: dto.ttsText,
      phraseForm: dto.phraseForm,
      cardType: dto.cardType,
      gender: dto.gender,
      phraseFormMasculine: dto.phraseFormMasculine,
      phraseFormFeminine: dto.phraseFormFeminine,
      phraseFormNeuter: dto.phraseFormNeuter,
      source: isCustom ? "CUSTOM" : "LIBRARY",
      isCustom,
    });
  }
}
