import { Card, CardSource, CardType, Gender } from "./card.entity";

export const CARD_REPOSITORY = Symbol("CARD_REPOSITORY");

export interface CreateCardData {
  categoryId: string;
  childId?: string | null;
  title: string;
  imageUrl?: string | null;
  color?: string;
  priority?: number;
  ttsText: string;
  phraseForm: string;
  cardType?: CardType;
  gender?: Gender | null;
  phraseFormMasculine?: string | null;
  phraseFormFeminine?: string | null;
  phraseFormNeuter?: string | null;
  source: CardSource;
  isCustom: boolean;
  isSystemCard?: boolean;
}

export interface UpdateCardData {
  categoryId?: string;
  title?: string;
  imageUrl?: string | null;
  color?: string;
  priority?: number;
  ttsText?: string;
  phraseForm?: string;
  cardType?: CardType;
  gender?: Gender | null;
  phraseFormMasculine?: string | null;
  phraseFormFeminine?: string | null;
  phraseFormNeuter?: string | null;
}

export interface SearchCardsFilter {
  categoryId?: string;
  childId?: string;
  query?: string;
  includeCustom?: boolean;
  cardType?: CardType;
  /** По умолчанию (undefined/false) служебные карточки Да/Нет исключаются из выборки. */
  isSystemCard?: boolean;
}

export interface CardRepository {
  findById(id: string): Promise<Card | null>;
  findByIds(ids: string[]): Promise<Card[]>;
  search(filter: SearchCardsFilter): Promise<Card[]>;
  create(data: CreateCardData): Promise<Card>;
  update(id: string, data: UpdateCardData): Promise<Card>;
  softDelete(id: string): Promise<void>;
}
