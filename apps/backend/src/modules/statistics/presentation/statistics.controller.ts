import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { StatisticsService } from "../application/statistics.service";
import { RecordCardUsageDto } from "../application/dto/record-card-usage.dto";
import { GetStatisticsDto } from "../application/dto/get-statistics.dto";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("record-usage")
  recordUsage(@Body() dto: RecordCardUsageDto) {
    return this.statisticsService.recordUsage(dto);
  }

  @Get()
  getDaily(@Query() query: GetStatisticsDto) {
    return this.statisticsService.getDaily(query);
  }
}
