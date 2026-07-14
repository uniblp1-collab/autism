import { Module } from "@nestjs/common";
import { StatisticsController } from "./statistics.controller";
import { StatisticsService } from "../application/statistics.service";
import { RecordCardUsageUseCase } from "../application/use-cases/record-card-usage.use-case";
import { GetDailyStatisticsUseCase } from "../application/use-cases/get-daily-statistics.use-case";
import { STATISTICS_REPOSITORY } from "../domain/statistics.repository";
import { PrismaStatisticsRepository } from "../infrastructure/prisma-statistics.repository";
import { ChildrenModule } from "../../children/presentation/children.module";

@Module({
  imports: [ChildrenModule],
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    RecordCardUsageUseCase,
    GetDailyStatisticsUseCase,
    { provide: STATISTICS_REPOSITORY, useClass: PrismaStatisticsRepository },
  ],
})
export class StatisticsModule {}
