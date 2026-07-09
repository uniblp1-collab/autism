import { Injectable } from "@nestjs/common";
import { Favorite } from "../domain/favorite.entity";
import { AddFavoriteDto } from "./dto/add-favorite.dto";
import { AddFavoriteUseCase } from "./use-cases/add-favorite.use-case";
import { RemoveFavoriteUseCase } from "./use-cases/remove-favorite.use-case";
import { ListFavoritesUseCase } from "./use-cases/list-favorites.use-case";

@Injectable()
export class FavoritesService {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
  ) {}

  add(dto: AddFavoriteDto): Promise<Favorite> {
    return this.addFavoriteUseCase.execute(dto);
  }

  remove(childId: string, cardId: string): Promise<void> {
    return this.removeFavoriteUseCase.execute(childId, cardId);
  }

  list(childId: string): Promise<Favorite[]> {
    return this.listFavoritesUseCase.execute(childId);
  }
}
