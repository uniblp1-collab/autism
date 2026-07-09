import { Inject, Injectable } from "@nestjs/common";
import { STATISTICS_REPOSITORY, StatisticsRepository } from "../../domain/statistics.repository";
import { RecordCardUsageDto } from "../dto/record-card-usage.dto";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class RecordCardUsageUseCase {
  constructor(@Inject(STATISTICS_REPOSITORY) private readonly statisticsRepository: StatisticsRepository) {}

  execute(dto: RecordCardUsageDto, now: Date = new Date()): Promise<void> {
    return this.statisticsRepository.recordUsage(dto.childId, dto.cardId, startOfUtcDay(now));
  }
}
