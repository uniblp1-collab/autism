import {
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { CardType, Gender } from "../../domain/card.entity";

const CARD_TYPES: CardType[] = ["NOUN", "ADJECTIVE"];
const GENDERS: Gender[] = ["MASCULINE", "FEMININE", "NEUTER"];

// Дублирует MIN_CUSTOM_CARD_PX/MAX_CUSTOM_CARD_PX из packages/ui (TASK_PATCH_3 §1) — не
// импортируется оттуда намеренно: backend не должен зависеть от frontend-пакета UI-примитивов,
// а @autism-connect/shared не годится для рантайм-импорта в backend (его "main" указывает на
// нескомпилированный .ts — `nest build` не бандлит workspace-зависимости, в отличие от Next.js
// с transpilePackages, поэтому node dist/main.js не смог бы разрешить такой импорт).
const MIN_CUSTOM_CARD_SIZE_PX = 80;
const MAX_CUSTOM_CARD_SIZE_PX = 320;

export class CreateCardDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  childId?: string;

  @IsString()
  @MaxLength(60)
  title: string;

  // Изображение загружается отдельно через админку (POST /admin/cards/:id/image).
  @IsOptional()
  @IsString()
  imageUrl?: string;

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

  @IsString()
  @MaxLength(60)
  phraseForm: string;

  @IsOptional()
  @IsEnum(CARD_TYPES)
  cardType?: CardType;

  @IsOptional()
  @IsEnum(GENDERS)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phraseFormMasculine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phraseFormFeminine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phraseFormNeuter?: string;

  // Точечный кастомный размер карточки в px (TASK_PATCH_3 §1) — задаётся через resize-жест
  // в режиме редактирования, границы совпадают с ограничением на фронтенде (packages/ui).
  @IsOptional()
  @IsInt()
  @Min(MIN_CUSTOM_CARD_SIZE_PX)
  @Max(MAX_CUSTOM_CARD_SIZE_PX)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(MIN_CUSTOM_CARD_SIZE_PX)
  @Max(MAX_CUSTOM_CARD_SIZE_PX)
  height?: number;
}
