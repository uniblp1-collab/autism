import { Inject, Injectable } from "@nestjs/common";
import { FAVORITE_REPOSITORY, FavoriteRepository } from "../../domain/favorite.repository";

@Injectable()
export class RemoveFavoriteUseCase {
  constructor(@Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: FavoriteRepository) {}

  execute(childId: string, cardId: string): Promise<void> {
    return this.favoriteRepository.remove(childId, cardId);
  }
}
