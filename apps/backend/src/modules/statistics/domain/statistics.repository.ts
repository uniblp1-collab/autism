import { DailyStatistics } from "./daily-statistics.entity";

export const STATISTICS_REPOSITORY = Symbol("STATISTICS_REPOSITORY");

export interface StatisticsRepository {
  recordUsage(childId: string, cardId: string, day: Date): Promise<void>;
  findByChildInRange(childId: string, from: Date, to: Date): Promise<DailyStatistics[]>;
}
