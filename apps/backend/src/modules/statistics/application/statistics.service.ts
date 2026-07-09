import { Injectable } from "@nestjs/common";
import { DailyStatistics } from "../domain/daily-statistics.entity";
import { RecordCardUsageDto } from "./dto/record-card-usage.dto";
import { GetStatisticsDto } from "./dto/get-statistics.dto";
import { RecordCardUsageUseCase } from "./use-cases/record-card-usage.use-case";
import { GetDailyStatisticsUseCase } from "./use-cases/get-daily-statistics.use-case";

@Injectable()
export class StatisticsService {
  constructor(
    private readonly recordCardUsageUseCase: RecordCardUsageUseCase,
    private readonly getDailyStatisticsUseCase: GetDailyStatisticsUseCase,
  ) {}

  recordUsage(dto: RecordCardUsageDto): Promise<void> {
    return this.recordCardUsageUseCase.execute(dto);
  }

  getDaily(dto: GetStatisticsDto): Promise<DailyStatistics[]> {
    return this.getDailyStatisticsUseCase.execute(dto);
  }
}
