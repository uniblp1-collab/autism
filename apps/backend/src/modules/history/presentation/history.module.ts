import { Module } from "@nestjs/common";
import { HistoryController } from "./history.controller";
import { HistoryService } from "../application/history.service";
import { CreateHistoryUseCase } from "../application/use-cases/create-history.use-case";
import { ListHistoryUseCase } from "../application/use-cases/list-history.use-case";
import { HISTORY_REPOSITORY } from "../domain/history.repository";
import { PrismaHistoryRepository } from "../infrastructure/prisma-history.repository";
import { CardsModule } from "../../cards/presentation/cards.module";
import { ChildrenModule } from "../../children/presentation/children.module";

@Module({
  imports: [CardsModule, ChildrenModule],
  controllers: [HistoryController],
  providers: [
    HistoryService,
    CreateHistoryUseCase,
    ListHistoryUseCase,
    { provide: HISTORY_REPOSITORY, useClass: PrismaHistoryRepository },
  ],
})
export class HistoryModule {}
