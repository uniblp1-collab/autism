import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { CardType } from "../../domain/card.entity";

const CARD_TYPES: CardType[] = ["NOUN", "ADJECTIVE"];

function toBoolean({ value }: { value: unknown }): unknown {
  return value === "true" || value === true;
}

export class SearchCardsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  childId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeCustom?: boolean;

  @IsOptional()
  @IsEnum(CARD_TYPES)
  cardType?: CardType;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isSystemCard?: boolean;
}
