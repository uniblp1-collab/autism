import { Statistics as PrismaStatistics, StatisticEntry as PrismaStatisticEntry } from "@autism-connect/database";
import { DailyStatistics } from "../domain/daily-statistics.entity";

type StatisticsWithEntries = PrismaStatistics & { entries: PrismaStatisticEntry[] };

export class StatisticsMapper {
  static toDomain(record: StatisticsWithEntries): DailyStatistics {
    return new DailyStatistics(
      record.day,
      record.totalCommunications,
      record.entries.map((entry) => ({ cardId: entry.cardId, usageCount: entry.usageCount })),
    );
  }
}
