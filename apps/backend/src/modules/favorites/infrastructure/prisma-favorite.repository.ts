import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { FavoriteRepository } from "../domain/favorite.repository";
import { Favorite } from "../domain/favorite.entity";
import { FavoriteMapper } from "./favorite.mapper";

@Injectable()
export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChild(childId: string): Promise<Favorite[]> {
    const records = await this.prisma.favorite.findMany({ where: { childId }, orderBy: { order: "asc" } });
    return records.map(FavoriteMapper.toDomain);
  }

  async exists(childId: string, cardId: string): Promise<boolean> {
    const record = await this.prisma.favorite.findUnique({ where: { childId_cardId: { childId, cardId } } });
    return Boolean(record);
  }

  async add(childId: string, cardId: string, order: number): Promise<Favorite> {
    const record = await this.prisma.favorite.create({ data: { childId, cardId, order } });
    return FavoriteMapper.toDomain(record);
  }

  async remove(childId: string, cardId: string): Promise<void> {
    await this.prisma.favorite.delete({ where: { childId_cardId: { childId, cardId } } });
  }
}
