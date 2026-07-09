import { Inject, Injectable } from "@nestjs/common";
import { FAVORITE_REPOSITORY, FavoriteRepository } from "../../domain/favorite.repository";
import { Favorite } from "../../domain/favorite.entity";
import { FavoriteAlreadyExistsException } from "../../domain/favorite-already-exists.exception";
import { AddFavoriteDto } from "../dto/add-favorite.dto";

@Injectable()
export class AddFavoriteUseCase {
  constructor(@Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: FavoriteRepository) {}

  async execute(dto: AddFavoriteDto): Promise<Favorite> {
    const alreadyExists = await this.favoriteRepository.exists(dto.childId, dto.cardId);
    if (alreadyExists) {
      throw new FavoriteAlreadyExistsException();
    }

    const existing = await this.favoriteRepository.findByChild(dto.childId);
    return this.favoriteRepository.add(dto.childId, dto.cardId, existing.length);
  }
}
