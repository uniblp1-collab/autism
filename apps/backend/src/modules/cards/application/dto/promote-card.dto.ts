import { IsUUID } from "class-validator";

export class PromoteCardDto {
  @IsUUID()
  childId: string;
}
