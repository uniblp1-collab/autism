import { IsBoolean, IsHexColor, IsInt, IsOptional, IsString, Min, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MaxLength(60)
  title: string;

  @IsString()
  @MaxLength(30)
  icon: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isHiddenFromNav?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phraseForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sentenceTemplate?: string;
}
