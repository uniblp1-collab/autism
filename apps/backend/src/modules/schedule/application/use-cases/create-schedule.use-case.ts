import { Inject, Injectable } from "@nestjs/common";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";
import { CreateScheduleDto } from "../dto/create-schedule.dto";

@Injectable()
export class CreateScheduleUseCase {
  constructor(@Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository) {}

  execute(dto: CreateScheduleDto): Promise<Schedule> {
    return this.scheduleRepository.create({
      childId: dto.childId,
      title: dto.title,
      items: (dto.items ?? []).map((item) => ({ title: item.title, cardId: item.cardId, order: item.order })),
    });
  }
}
