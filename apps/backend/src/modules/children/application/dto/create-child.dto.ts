import { IsArray, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, MaxLength, Min } from "class-validator";
import { CardSize, DifficultyLevel, SpeechLevel } from "../../domain/child.entity";

const CARD_SIZES: CardSize[] = ["SMALL", "MEDIUM", "LARGE"];

export class CreateChildDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsInt()
  @Min(0)
  @Max(18)
  age: number;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsEnum(["NONE", "SINGLE_WORDS", "PHRASES", "SENTENCES"])
  speechLevel: SpeechLevel;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  favoriteCategoryIds?: string[];

  @IsOptional()
  @IsIn([1, 2, 3])
  difficultyLevel?: DifficultyLevel;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  unlockedCategoryIds?: string[];

  @IsOptional()
  @IsEnum(CARD_SIZES)
  cardSize?: CardSize;
}
