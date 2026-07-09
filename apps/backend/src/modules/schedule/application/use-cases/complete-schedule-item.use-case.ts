import { Inject, Injectable } from "@nestjs/common";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../../domain/schedule.repository";
import { ScheduleItem } from "../../domain/schedule-item.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

@Injectable()
export class CompleteScheduleItemUseCase {
  constructor(@Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository) {}

  async execute(itemId: string, isCompleted: boolean): Promise<ScheduleItem> {
    const item = await this.scheduleRepository.findItemById(itemId);
    if (!item) {
      throw new EntityNotFoundException("ScheduleItem", itemId);
    }
    return this.scheduleRepository.setItemCompletion(itemId, isCompleted);
  }
}
