import { IsHexColor, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class CreateCardDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  childId?: string;

  @IsString()
  @MaxLength(60)
  title: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @IsString()
  @MaxLength(200)
  ttsText: string;
}
