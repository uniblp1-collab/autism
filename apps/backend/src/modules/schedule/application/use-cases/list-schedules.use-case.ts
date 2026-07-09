import { Inject, Injectable } from "@nestjs/common";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";

@Injectable()
export class ListSchedulesUseCase {
  constructor(@Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository) {}

  execute(childId: string): Promise<Schedule[]> {
    return this.scheduleRepository.findByChild(childId);
  }
}
