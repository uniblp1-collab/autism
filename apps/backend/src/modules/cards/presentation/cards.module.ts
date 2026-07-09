import { Module } from "@nestjs/common";
import { CardsController } from "./cards.controller";
import { CardsService } from "../application/cards.service";
import { CreateCardUseCase } from "../application/use-cases/create-card.use-case";
import { SearchCardsUseCase } from "../application/use-cases/search-cards.use-case";
import { GetCardUseCase } from "../application/use-cases/get-card.use-case";
import { UpdateCardUseCase } from "../application/use-cases/update-card.use-case";
import { DeleteCardUseCase } from "../application/use-cases/delete-card.use-case";
import { CARD_REPOSITORY } from "../domain/card.repository";
import { PrismaCardRepository } from "../infrastructure/prisma-card.repository";
import { CARD_GENERATOR_PORT } from "../domain/card-generator.port";
import { NoopCardGeneratorAdapter } from "../infrastructure/noop-card-generator.adapter";

@Module({
  controllers: [CardsController],
  providers: [
    CardsService,
    CreateCardUseCase,
    SearchCardsUseCase,
    GetCardUseCase,
    UpdateCardUseCase,
    DeleteCardUseCase,
    { provide: CARD_REPOSITORY, useClass: PrismaCardRepository },
    { provide: CARD_GENERATOR_PORT, useClass: NoopCardGeneratorAdapter },
  ],
  exports: [CARD_REPOSITORY],
})
export class CardsModule {}
