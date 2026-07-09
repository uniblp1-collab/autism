import { Favorite as PrismaFavorite } from "@autism-connect/database";
import { Favorite } from "../domain/favorite.entity";

export class FavoriteMapper {
  static toDomain(record: PrismaFavorite): Favorite {
    return new Favorite(record.id, record.childId, record.cardId, record.order, record.createdAt);
  }
}
