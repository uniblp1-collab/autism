import { Module } from "@nestjs/common";
import { ScheduleController } from "./schedule.controller";
import { ScheduleService } from "../application/schedule.service";
import { CreateScheduleUseCase } from "../application/use-cases/create-schedule.use-case";
import { ListSchedulesUseCase } from "../application/use-cases/list-schedules.use-case";
import { AddScheduleItemUseCase } from "../application/use-cases/add-schedule-item.use-case";
import { CompleteScheduleItemUseCase } from "../application/use-cases/complete-schedule-item.use-case";
import { ScheduleResetService } from "../application/schedule-reset.service";
import { SCHEDULE_REPOSITORY } from "../domain/schedule.repository";
import { PrismaScheduleRepository } from "../infrastructure/prisma-schedule.repository";
import { ChildrenModule } from "../../children/presentation/children.module";

@Module({
  imports: [ChildrenModule],
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    CreateScheduleUseCase,
    ListSchedulesUseCase,
    AddScheduleItemUseCase,
    CompleteScheduleItemUseCase,
    ScheduleResetService,
    { provide: SCHEDULE_REPOSITORY, useClass: PrismaScheduleRepository },
  ],
})
export class ScheduleModule {}
