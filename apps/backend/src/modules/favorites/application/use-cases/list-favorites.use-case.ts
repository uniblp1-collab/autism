import { Inject, Injectable } from "@nestjs/common";
import { FAVORITE_REPOSITORY, FavoriteRepository } from "../../domain/favorite.repository";
import { Favorite } from "../../domain/favorite.entity";

@Injectable()
export class ListFavoritesUseCase {
  constructor(@Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: FavoriteRepository) {}

  execute(childId: string): Promise<Favorite[]> {
    return this.favoriteRepository.findByChild(childId);
  }
}
