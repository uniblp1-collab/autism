import { Inject, Injectable } from "@nestjs/common";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";
import { ChildAccessService } from "../../../children/application/child-access.service";

@Injectable()
export class ListSchedulesUseCase {
  constructor(
    @Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async execute(userId: string, childId: string): Promise<Schedule[]> {
    await this.childAccessService.assertOwnedByUser(childId, userId);
    return this.scheduleRepository.findByChild(childId);
  }
}
