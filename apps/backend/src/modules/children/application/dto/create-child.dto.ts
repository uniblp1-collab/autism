import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, MaxLength, Min } from "class-validator";
import { SpeechLevel } from "../../domain/child.entity";

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
}
