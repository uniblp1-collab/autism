import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

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
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeCustom?: boolean;
}
