import { Injectable } from "@nestjs/common";
import { Favorite } from "../domain/favorite.entity";
import { AddFavoriteDto } from "./dto/add-favorite.dto";
import { AddFavoriteUseCase } from "./use-cases/add-favorite.use-case";
import { RemoveFavoriteUseCase } from "./use-cases/remove-favorite.use-case";
import { ListFavoritesUseCase } from "./use-cases/list-favorites.use-case";
import { ChildAccessService } from "../../children/application/child-access.service";

@Injectable()
export class FavoritesService {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async add(userId: string, dto: AddFavoriteDto): Promise<Favorite> {
    await this.childAccessService.assertOwnedByUser(dto.childId, userId);
    return this.addFavoriteUseCase.execute(dto);
  }

  async remove(userId: string, childId: string, cardId: string): Promise<void> {
    await this.childAccessService.assertOwnedByUser(childId, userId);
    return this.removeFavoriteUseCase.execute(childId, cardId);
  }

  async list(userId: string, childId: string): Promise<Favorite[]> {
    await this.childAccessService.assertOwnedByUser(childId, userId);
    return this.listFavoritesUseCase.execute(childId);
  }
}
