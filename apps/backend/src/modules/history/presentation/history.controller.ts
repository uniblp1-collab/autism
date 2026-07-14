import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { HistoryService } from "../application/history.service";
import { CreateHistoryDto } from "../application/dto/create-history.dto";
import { CurrentUser, CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Controller("history")
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateHistoryDto) {
    return this.historyService.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Query("childId") childId: string) {
    return this.historyService.list(user.userId, childId);
  }
}
