import { Injectable } from "@nestjs/common";
import { Prisma } from "@autism-connect/database";
import { PrismaService } from "../../../prisma/prisma.service";
import { CardRepository, CreateCardData, SearchCardsFilter, UpdateCardData } from "../domain/card.repository";
import { Card } from "../domain/card.entity";
import { CardsMapper } from "./cards.mapper";

@Injectable()
export class PrismaCardRepository implements CardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Card | null> {
    const record = await this.prisma.card.findFirst({ where: { id, deletedAt: null } });
    return record ? CardsMapper.toDomain(record) : null;
  }

  async findByIds(ids: string[]): Promise<Card[]> {
    if (ids.length === 0) return [];
    const records = await this.prisma.card.findMany({ where: { id: { in: ids }, deletedAt: null } });
    return records.map(CardsMapper.toDomain);
  }

  async search(filter: SearchCardsFilter): Promise<Card[]> {
    const where: Prisma.CardWhereInput = { deletedAt: null, isSystemCard: filter.isSystemCard ?? false };

    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.query) where.title = { contains: filter.query, mode: "insensitive" };
    if (filter.cardType) where.cardType = filter.cardType;

    if (filter.childId && filter.includeCustom) {
      where.OR = [{ childId: null }, { childId: filter.childId }];
    } else if (filter.childId) {
      where.childId = filter.childId;
    } else {
      where.childId = null;
    }

    const records = await this.prisma.card.findMany({
      where,
      orderBy: [{ priority: "desc" }, { title: "asc" }],
    });
    return records.map(CardsMapper.toDomain);
  }

  async create(data: CreateCardData): Promise<Card> {
    const record = await this.prisma.card.create({ data });
    return CardsMapper.toDomain(record);
  }

  async update(id: string, data: UpdateCardData): Promise<Card> {
    const record = await this.prisma.card.update({ where: { id }, data });
    return CardsMapper.toDomain(record);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.card.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
