import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateScheduleData, CreateScheduleItemData, ScheduleRepository } from "../domain/schedule.repository";
import { Schedule } from "../domain/schedule.entity";
import { ScheduleItem } from "../domain/schedule-item.entity";
import { ScheduleMapper } from "./schedule.mapper";

const includeItems = { items: true };

@Injectable()
export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChild(childId: string): Promise<Schedule[]> {
    const records = await this.prisma.schedule.findMany({
      where: { childId },
      include: includeItems,
      orderBy: { createdAt: "asc" },
    });
    return records.map(ScheduleMapper.toDomain);
  }

  async findById(id: string): Promise<Schedule | null> {
    const record = await this.prisma.schedule.findUnique({ where: { id }, include: includeItems });
    return record ? ScheduleMapper.toDomain(record) : null;
  }

  async create(data: CreateScheduleData): Promise<Schedule> {
    const record = await this.prisma.schedule.create({
      data: {
        childId: data.childId,
        title: data.title,
        items: { create: data.items.map((item) => ({ title: item.title, cardId: item.cardId, order: item.order })) },
      },
      include: includeItems,
    });
    return ScheduleMapper.toDomain(record);
  }

  async addItem(scheduleId: string, data: CreateScheduleItemData): Promise<Schedule> {
    await this.prisma.scheduleItem.create({
      data: { scheduleId, title: data.title, cardId: data.cardId, order: data.order },
    });
    const record = await this.prisma.schedule.findUniqueOrThrow({ where: { id: scheduleId }, include: includeItems });
    return ScheduleMapper.toDomain(record);
  }

  async findItemById(itemId: string): Promise<ScheduleItem | null> {
    const record = await this.prisma.scheduleItem.findUnique({ where: { id: itemId } });
    return record ? ScheduleMapper.itemToDomain(record) : null;
  }

  async setItemCompletion(itemId: string, isCompleted: boolean): Promise<ScheduleItem> {
    const record = await this.prisma.scheduleItem.update({
      where: { id: itemId },
      data: { isCompleted, completedAt: isCompleted ? new Date() : null },
    });
    return ScheduleMapper.itemToDomain(record);
  }
}
