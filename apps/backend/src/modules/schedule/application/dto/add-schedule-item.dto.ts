import { IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from "class-validator";

export class AddScheduleItemDto {
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
