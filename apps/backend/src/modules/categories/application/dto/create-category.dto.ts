import { IsInt, IsOptional, IsString, Min, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MaxLength(60)
  title: string;

  @IsString()
  @MaxLength(10)
  icon: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
