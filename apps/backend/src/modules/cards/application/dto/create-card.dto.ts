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
}
