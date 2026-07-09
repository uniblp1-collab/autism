import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { StatisticsRepository } from "../domain/statistics.repository";
import { DailyStatistics } from "../domain/daily-statistics.entity";
import { StatisticsMapper } from "./statistics.mapper";

@Injectable()
export class PrismaStatisticsRepository implements StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recordUsage(childId: string, cardId: string, day: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const stats = await tx.statistics.upsert({
        where: { childId_day: { childId, day } },
        update: { totalCommunications: { increment: 1 } },
        create: { childId, day, totalCommunications: 1 },
      });

      await tx.statisticEntry.upsert({
        where: { statisticsId_cardId: { statisticsId: stats.id, cardId } },
        update: { usageCount: { increment: 1 } },
        create: { statisticsId: stats.id, cardId, usageCount: 1 },
      });
    });
  }

  async findByChildInRange(childId: string, from: Date, to: Date): Promise<DailyStatistics[]> {
    const records = await this.prisma.statistics.findMany({
      where: { childId, day: { gte: from, lte: to } },
      include: { entries: true },
      orderBy: { day: "asc" },
    });
    return records.map(StatisticsMapper.toDomain);
  }
}
