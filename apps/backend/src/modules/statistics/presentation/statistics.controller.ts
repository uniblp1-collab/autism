import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { StatisticsService } from "../application/statistics.service";
import { RecordCardUsageDto } from "../application/dto/record-card-usage.dto";
import { GetStatisticsDto } from "../application/dto/get-statistics.dto";
import { CurrentUser, CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("record-usage")
  recordUsage(@CurrentUser() user: CurrentUserPayload, @Body() dto: RecordCardUsageDto) {
    return this.statisticsService.recordUsage(user.userId, dto);
  }

  @Get()
  getDaily(@CurrentUser() user: CurrentUserPayload, @Query() query: GetStatisticsDto) {
    return this.statisticsService.getDaily(user.userId, query);
  }
}
