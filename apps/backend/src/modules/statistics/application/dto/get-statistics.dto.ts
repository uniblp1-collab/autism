import { IsISO8601, IsOptional, IsUUID } from "class-validator";

export class GetStatisticsDto {
  @IsUUID()
  childId: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
