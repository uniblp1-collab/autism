import { CardSize, Child, DifficultyLevel, SpeechLevel } from "./child.entity";

export const CHILD_REPOSITORY = Symbol("CHILD_REPOSITORY");

export interface CreateChildData {
  userId: string;
  name: string;
  age: number;
  photoUrl?: string | null;
  speechLevel: SpeechLevel;
  favoriteCategoryIds?: string[];
  difficultyLevel?: DifficultyLevel;
  unlockedCategoryIds?: string[];
  cardSize?: CardSize;
  cardsPerPage?: number;
}

export interface UpdateChildData {
  name?: string;
  age?: number;
  photoUrl?: string | null;
  speechLevel?: SpeechLevel;
  favoriteCategoryIds?: string[];
  difficultyLevel?: DifficultyLevel;
  unlockedCategoryIds?: string[];
  cardSize?: CardSize;
  cardsPerPage?: number;
}

export interface ChildRepository {
  findByUserId(userId: string): Promise<Child[]>;
  findByIdForUser(id: string, userId: string): Promise<Child | null>;
  create(data: CreateChildData): Promise<Child>;
  update(id: string, data: UpdateChildData): Promise<Child>;
  delete(id: string): Promise<void>;
}
