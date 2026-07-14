import { Inject, Injectable } from "@nestjs/common";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { AddScheduleItemDto } from "../dto/add-schedule-item.dto";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class AddScheduleItemUseCase {
  constructor(
    @Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async execute(userId: string, scheduleId: string, dto: AddScheduleItemDto): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new EntityNotFoundException("Schedule", scheduleId);
    }
    await this.childAccessService.assertOwnedByUser(schedule.childId, userId);
    return this.scheduleRepository.addItem(scheduleId, dto);
  }
}
