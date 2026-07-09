import { IsUUID } from "class-validator";

export class RecordCardUsageDto {
  @IsUUID()
  childId: string;

  @IsUUID()
  cardId: string;
}
