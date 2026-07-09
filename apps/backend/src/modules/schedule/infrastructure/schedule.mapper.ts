import { Schedule as PrismaSchedule, ScheduleItem as PrismaScheduleItem } from "@autism-connect/database";
import { Schedule } from "../domain/schedule.entity";
import { ScheduleItem } from "../domain/schedule-item.entity";

type ScheduleWithItems = PrismaSchedule & { items: PrismaScheduleItem[] };

export class ScheduleMapper {
  static itemToDomain(record: PrismaScheduleItem): ScheduleItem {
    return new ScheduleItem(
      record.id,
      record.scheduleId,
      record.cardId,
      record.title,
      record.order,
      record.isCompleted,
      record.completedAt,
    );
  }

  static toDomain(record: ScheduleWithItems): Schedule {
    const items = [...record.items].sort((a, b) => a.order - b.order).map(ScheduleMapper.itemToDomain);
    return new Schedule(record.id, record.childId, record.title, items, record.createdAt, record.updatedAt);
  }
}
