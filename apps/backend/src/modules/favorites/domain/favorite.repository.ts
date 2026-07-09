import { Favorite } from "./favorite.entity";

export const FAVORITE_REPOSITORY = Symbol("FAVORITE_REPOSITORY");

export interface FavoriteRepository {
  findByChild(childId: string): Promise<Favorite[]>;
  exists(childId: string, cardId: string): Promise<boolean>;
  add(childId: string, cardId: string, order: number): Promise<Favorite>;
  remove(childId: string, cardId: string): Promise<void>;
}
