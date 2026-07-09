import { Inject, Injectable } from "@nestjs/common";
import { STATISTICS_REPOSITORY, StatisticsRepository } from "../../domain/statistics.repository";
import { DailyStatistics } from "../../domain/daily-statistics.entity";
import { GetStatisticsDto } from "../dto/get-statistics.dto";

const DEFAULT_RANGE_DAYS = 30;

@Injectable()
export class GetDailyStatisticsUseCase {
  constructor(@Inject(STATISTICS_REPOSITORY) private readonly statisticsRepository: StatisticsRepository) {}

  execute(dto: GetStatisticsDto): Promise<DailyStatistics[]> {
    const to = dto.to ? new Date(dto.to) : new Date();
    const from = dto.from
      ? new Date(dto.from)
      : new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

    return this.statisticsRepository.findByChildInRange(dto.childId, from, to);
  }
}
