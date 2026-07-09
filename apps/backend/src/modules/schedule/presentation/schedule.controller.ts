import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ScheduleService } from "../application/schedule.service";
import { CreateScheduleDto } from "../application/dto/create-schedule.dto";
import { AddScheduleItemDto } from "../application/dto/add-schedule-item.dto";
import { CompleteScheduleItemDto } from "../application/dto/complete-schedule-item.dto";

@Controller("schedules")
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  list(@Query("childId") childId: string) {
    return this.scheduleService.list(childId);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  @Post(":scheduleId/items")
  addItem(@Param("scheduleId") scheduleId: string, @Body() dto: AddScheduleItemDto) {
    return this.scheduleService.addItem(scheduleId, dto);
  }

  @Patch("items/:itemId")
  completeItem(@Param("itemId") itemId: string, @Body() dto: CompleteScheduleItemDto) {
    return this.scheduleService.completeItem(itemId, dto.isCompleted);
  }
}
