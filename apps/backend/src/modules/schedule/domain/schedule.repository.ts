import { Schedule } from "./schedule.entity";
import { ScheduleItem } from "./schedule-item.entity";

export const SCHEDULE_REPOSITORY = Symbol("SCHEDULE_REPOSITORY");

export interface CreateScheduleItemData {
  title: string;
  cardId?: string | null;
  order: number;
}

export interface CreateScheduleData {
  childId: string;
  title: string;
  items: CreateScheduleItemData[];
}

export interface ScheduleRepository {
  findByChild(childId: string): Promise<Schedule[]>;
  findById(id: string): Promise<Schedule | null>;
  create(data: CreateScheduleData): Promise<Schedule>;
  addItem(scheduleId: string, data: CreateScheduleItemData): Promise<Schedule>;
  findItemById(itemId: string): Promise<ScheduleItem | null>;
  setItemCompletion(itemId: string, isCompleted: boolean): Promise<ScheduleItem>;
  /** Сброс отметок "выполнено" по всем шагам расписания всех детей (ТЗ §6.11, ежедневный cron). */
  resetAllCompletions(): Promise<void>;
}
