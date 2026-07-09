import { Card, CardSource } from "./card.entity";

export const CARD_REPOSITORY = Symbol("CARD_REPOSITORY");

export interface CreateCardData {
  categoryId: string;
  childId?: string | null;
  title: string;
  imageUrl: string;
  color?: string;
  priority?: number;
  ttsText: string;
  source: CardSource;
  isCustom: boolean;
}

export interface UpdateCardData {
  categoryId?: string;
  title?: string;
  imageUrl?: string;
  color?: string;
  priority?: number;
  ttsText?: string;
}

export interface SearchCardsFilter {
  categoryId?: string;
  childId?: string;
  query?: string;
  includeCustom?: boolean;
}

export interface CardRepository {
  findById(id: string): Promise<Card | null>;
  search(filter: SearchCardsFilter): Promise<Card[]>;
  create(data: CreateCardData): Promise<Card>;
  update(id: string, data: UpdateCardData): Promise<Card>;
  softDelete(id: string): Promise<void>;
}
