import { IsHexColor, IsInt, IsOptional, IsString, Min, MaxLength } from "class-validator";

// Частичное обновление категории (редактирование "озвучки"/названия раздела из режима
// редактирования на экране ребёнка). Структурные флаги (isPrimary/isHiddenFromNav/isSystem)
// этой ручкой не меняются — только контентные поля. class-validator, а не импорт zod-схемы из
// @autism-connect/shared: backend не должен зависеть от shared в рантайме (см. create-card.dto.ts).
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  icon?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  // Пустая строка допустима: у категорий вроде "Гигиена" глагол-связка отсутствует.
  @IsOptional()
  @IsString()
  @MaxLength(60)
  phraseForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sentenceTemplate?: string;
}
