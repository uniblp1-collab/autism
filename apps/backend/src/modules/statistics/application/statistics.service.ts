import { Injectable } from "@nestjs/common";
import { DailyStatistics } from "../domain/daily-statistics.entity";
import { RecordCardUsageDto } from "./dto/record-card-usage.dto";
import { GetStatisticsDto } from "./dto/get-statistics.dto";
import { RecordCardUsageUseCase } from "./use-cases/record-card-usage.use-case";
import { GetDailyStatisticsUseCase } from "./use-cases/get-daily-statistics.use-case";
import { ChildAccessService } from "../../children/application/child-access.service";

@Injectable()
export class StatisticsService {
  constructor(
    private readonly recordCardUsageUseCase: RecordCardUsageUseCase,
    private readonly getDailyStatisticsUseCase: GetDailyStatisticsUseCase,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async recordUsage(userId: string, dto: RecordCardUsageDto): Promise<void> {
    await this.childAccessService.assertOwnedByUser(dto.childId, userId);
    return this.recordCardUsageUseCase.execute(dto);
  }

  async getDaily(userId: string, dto: GetStatisticsDto): Promise<DailyStatistics[]> {
    await this.childAccessService.assertOwnedByUser(dto.childId, userId);
    return this.getDailyStatisticsUseCase.execute(dto);
  }
}
