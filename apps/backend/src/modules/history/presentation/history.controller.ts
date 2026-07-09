import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { HistoryService } from "../application/history.service";
import { CreateHistoryDto } from "../application/dto/create-history.dto";

@Controller("history")
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  create(@Body() dto: CreateHistoryDto) {
    return this.historyService.create(dto);
  }

  @Get()
  list(@Query("childId") childId: string) {
    return this.historyService.list(childId);
  }
}
