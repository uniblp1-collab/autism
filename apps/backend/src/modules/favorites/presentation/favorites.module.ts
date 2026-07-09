import { Module } from "@nestjs/common";
import { FavoritesController } from "./favorites.controller";
import { FavoritesService } from "../application/favorites.service";
import { AddFavoriteUseCase } from "../application/use-cases/add-favorite.use-case";
import { RemoveFavoriteUseCase } from "../application/use-cases/remove-favorite.use-case";
import { ListFavoritesUseCase } from "../application/use-cases/list-favorites.use-case";
import { FAVORITE_REPOSITORY } from "../domain/favorite.repository";
import { PrismaFavoriteRepository } from "../infrastructure/prisma-favorite.repository";

@Module({
  controllers: [FavoritesController],
  providers: [
    FavoritesService,
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListFavoritesUseCase,
    { provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
  ],
})
export class FavoritesModule {}
