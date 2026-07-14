import { Module } from "@nestjs/common";
import { CardsController } from "./cards.controller";
import { CardsService } from "../application/cards.service";
import { CreateCardUseCase } from "../application/use-cases/create-card.use-case";
import { SearchCardsUseCase } from "../application/use-cases/search-cards.use-case";
import { GetCardUseCase } from "../application/use-cases/get-card.use-case";
import { UpdateCardUseCase } from "../application/use-cases/update-card.use-case";
import { DeleteCardUseCase } from "../application/use-cases/delete-card.use-case";
import { UploadCardImageUseCase } from "../application/use-cases/upload-card-image.use-case";
import { CARD_REPOSITORY } from "../domain/card.repository";
import { PrismaCardRepository } from "../infrastructure/prisma-card.repository";
import { CARD_GENERATOR_PORT } from "../domain/card-generator.port";
import { NoopCardGeneratorAdapter } from "../infrastructure/noop-card-generator.adapter";
import { StorageModule } from "../../../storage/storage.module";
import { ChildrenModule } from "../../children/presentation/children.module";

@Module({
  imports: [StorageModule, ChildrenModule],
  controllers: [CardsController],
  providers: [
    CardsService,
    CreateCardUseCase,
    SearchCardsUseCase,
    GetCardUseCase,
    UpdateCardUseCase,
    DeleteCardUseCase,
    UploadCardImageUseCase,
    { provide: CARD_REPOSITORY, useClass: PrismaCardRepository },
    { provide: CARD_GENERATOR_PORT, useClass: NoopCardGeneratorAdapter },
  ],
  // UploadCardImageUseCase экспортируется, чтобы AdminModule мог переиспользовать ту же
  // бизнес-логику для своей (параллельной) админской ручки загрузки картинки — сама загрузка
  // изображений принадлежит домену карточек, а не админке (см. загрузку из режима редактирования
  // в CardsController.uploadImage).
  exports: [CARD_REPOSITORY, UploadCardImageUseCase],
})
export class CardsModule {}
