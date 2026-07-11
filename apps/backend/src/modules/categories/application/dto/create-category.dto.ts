import { IsHexColor, IsInt, IsOptional, IsString, Min, MaxLength } from "class-validator";

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
}
