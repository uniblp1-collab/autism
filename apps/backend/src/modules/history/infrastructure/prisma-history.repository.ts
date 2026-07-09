import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { HistoryRepository } from "../domain/history.repository";
import { HistoryEntry } from "../domain/history-entry.entity";
import { HistoryMapper } from "./history.mapper";

@Injectable()
export class PrismaHistoryRepository implements HistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(childId: string, sentenceText: string, cardIds: string[]): Promise<HistoryEntry> {
    const record = await this.prisma.history.create({
      data: {
        childId,
        sentenceText,
        items: {
          create: cardIds.map((cardId, position) => ({ cardId, position })),
        },
      },
      include: { items: true },
    });
    return HistoryMapper.toDomain(record);
  }

  async findRecentByChild(childId: string, limit: number): Promise<HistoryEntry[]> {
    const records = await this.prisma.history.findMany({
      where: { childId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return records.map(HistoryMapper.toDomain);
  }

  countByChild(childId: string): Promise<number> {
    return this.prisma.history.count({ where: { childId } });
  }

  async deleteOldestBeyond(childId: string, keep: number): Promise<void> {
    const toKeep = await this.prisma.history.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
      take: keep,
      select: { id: true },
    });
    await this.prisma.history.deleteMany({
      where: { childId, id: { notIn: toKeep.map((entry) => entry.id) } },
    });
  }
}
