import { Injectable } from "@nestjs/common";
import { Schedule } from "../domain/schedule.entity";
import { ScheduleItem } from "../domain/schedule-item.entity";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { AddScheduleItemDto } from "./dto/add-schedule-item.dto";
import { CreateScheduleUseCase } from "./use-cases/create-schedule.use-case";
import { ListSchedulesUseCase } from "./use-cases/list-schedules.use-case";
import { AddScheduleItemUseCase } from "./use-cases/add-schedule-item.use-case";
import { CompleteScheduleItemUseCase } from "./use-cases/complete-schedule-item.use-case";

@Injectable()
export class ScheduleService {
  constructor(
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly listSchedulesUseCase: ListSchedulesUseCase,
    private readonly addScheduleItemUseCase: AddScheduleItemUseCase,
    private readonly completeScheduleItemUseCase: CompleteScheduleItemUseCase,
  ) {}

  create(userId: string, dto: CreateScheduleDto): Promise<Schedule> {
    return this.createScheduleUseCase.execute(userId, dto);
  }

  list(userId: string, childId: string): Promise<Schedule[]> {
    return this.listSchedulesUseCase.execute(userId, childId);
  }

  addItem(userId: string, scheduleId: string, dto: AddScheduleItemDto): Promise<Schedule> {
    return this.addScheduleItemUseCase.execute(userId, scheduleId, dto);
  }

  completeItem(userId: string, itemId: string, isCompleted: boolean): Promise<ScheduleItem> {
    return this.completeScheduleItemUseCase.execute(userId, itemId, isCompleted);
  }
}
