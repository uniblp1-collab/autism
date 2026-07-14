import { Injectable } from "@nestjs/common";
import { Card } from "../domain/card.entity";
import { CreateCardDto } from "./dto/create-card.dto";
import { UpdateCardDto } from "./dto/update-card.dto";
import { SearchCardsDto } from "./dto/search-cards.dto";
import { CreateCardUseCase } from "./use-cases/create-card.use-case";
import { SearchCardsUseCase } from "./use-cases/search-cards.use-case";
import { GetCardUseCase } from "./use-cases/get-card.use-case";
import { UpdateCardUseCase } from "./use-cases/update-card.use-case";
import { DeleteCardUseCase } from "./use-cases/delete-card.use-case";
import { UploadCardImageUseCase } from "./use-cases/upload-card-image.use-case";

@Injectable()
export class CardsService {
  constructor(
    private readonly createCardUseCase: CreateCardUseCase,
    private readonly searchCardsUseCase: SearchCardsUseCase,
    private readonly getCardUseCase: GetCardUseCase,
    private readonly updateCardUseCase: UpdateCardUseCase,
    private readonly deleteCardUseCase: DeleteCardUseCase,
    private readonly uploadCardImageUseCase: UploadCardImageUseCase,
  ) {}

  create(userId: string, dto: CreateCardDto): Promise<Card> {
    return this.createCardUseCase.execute(userId, dto);
  }

  search(dto: SearchCardsDto): Promise<Card[]> {
    return this.searchCardsUseCase.execute(dto);
  }

  getOne(id: string): Promise<Card> {
    return this.getCardUseCase.execute(id);
  }

  update(userId: string, id: string, dto: UpdateCardDto): Promise<Card> {
    return this.updateCardUseCase.execute(userId, id, dto);
  }

  remove(userId: string, id: string): Promise<void> {
    return this.deleteCardUseCase.execute(userId, id);
  }

  uploadImage(userId: string, id: string, file: Express.Multer.File | undefined): Promise<Card> {
    return this.uploadCardImageUseCase.execute(id, file, userId);
  }
}
