import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength, ValidateNested } from "class-validator";

export class CreateScheduleItemDto {
  @IsString()
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsUUID()
  cardId?: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class CreateScheduleDto {
  @IsUUID()
  childId: string;

  @IsString()
  @MaxLength(60)
  title: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleItemDto)
  items?: CreateScheduleItemDto[];
}
