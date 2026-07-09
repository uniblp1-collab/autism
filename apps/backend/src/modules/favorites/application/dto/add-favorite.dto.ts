import { IsUUID } from "class-validator";

export class AddFavoriteDto {
  @IsUUID()
  childId: string;

  @IsUUID()
  cardId: string;
}
