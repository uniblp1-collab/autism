import { Inject, Injectable } from "@nestjs/common";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../../domain/schedule.repository";
import { ScheduleItem } from "../../domain/schedule-item.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class CompleteScheduleItemUseCase {
  constructor(
    @Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async execute(userId: string, itemId: string, isCompleted: boolean): Promise<ScheduleItem> {
    const item = await this.scheduleRepository.findItemById(itemId);
    if (!item) {
      throw new EntityNotFoundException("ScheduleItem", itemId);
    }
    // У ScheduleItem нет своего childId — принадлежность определяется через родительское
    // расписание, поэтому дополнительный findById неизбежен.
    const schedule = await this.scheduleRepository.findById(item.scheduleId);
    if (!schedule) {
      throw new EntityNotFoundException("Schedule", item.scheduleId);
    }
    await this.childAccessService.assertOwnedByUser(schedule.childId, userId);
    return this.scheduleRepository.setItemCompletion(itemId, isCompleted);
  }
}
