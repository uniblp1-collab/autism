import { IsBoolean } from "class-validator";

export class CompleteScheduleItemDto {
  @IsBoolean()
  isCompleted: boolean;
}
