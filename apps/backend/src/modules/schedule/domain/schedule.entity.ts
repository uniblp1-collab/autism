import { ScheduleItem } from "./schedule-item.entity";

export class Schedule {
  constructor(
    public readonly id: string,
    public readonly childId: string,
    public readonly title: string,
    public readonly items: ScheduleItem[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
