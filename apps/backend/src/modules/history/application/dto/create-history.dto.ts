import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateHistoryDto {
  @IsUUID()
  childId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  cardIds: string[];

  // Категория-глагол не является карточкой, поэтому склеить фразу "Дай яблоко"
  // из одних ttsText карточек нельзя — фронтенд для уровней 2/3 собирает готовое
  // предложение по sentenceTemplate и передаёт его явно.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sentenceText?: string;
}
