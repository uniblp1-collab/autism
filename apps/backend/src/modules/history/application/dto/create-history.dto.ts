import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class CreateHistoryDto {
  @IsUUID()
  childId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  cardIds: string[];
}
