import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ScheduleService } from "../application/schedule.service";
import { CreateScheduleDto } from "../application/dto/create-schedule.dto";
import { AddScheduleItemDto } from "../application/dto/add-schedule-item.dto";
import { CompleteScheduleItemDto } from "../application/dto/complete-schedule-item.dto";
import { CurrentUser, CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Controller("schedules")
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Query("childId") childId: string) {
    return this.scheduleService.list(user.userId, childId);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(user.userId, dto);
  }

  @Post(":scheduleId/items")
  addItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param("scheduleId") scheduleId: string,
    @Body() dto: AddScheduleItemDto,
  ) {
    return this.scheduleService.addItem(user.userId, scheduleId, dto);
  }

  @Patch("items/:itemId")
  completeItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param("itemId") itemId: string,
    @Body() dto: CompleteScheduleItemDto,
  ) {
    return this.scheduleService.completeItem(user.userId, itemId, dto.isCompleted);
  }
}
