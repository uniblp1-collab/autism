import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ChildRepository, CreateChildData, UpdateChildData } from "../domain/child.repository";
import { Child } from "../domain/child.entity";
import { ChildMapper } from "./child.mapper";

const includeFavorites = { favoriteCategories: true };

@Injectable()
export class PrismaChildRepository implements ChildRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Child[]> {
    const records = await this.prisma.child.findMany({
      where: { userId },
      include: includeFavorites,
      orderBy: { createdAt: "asc" },
    });
    return records.map(ChildMapper.toDomain);
  }

  async findByIdForUser(id: string, userId: string): Promise<Child | null> {
    const record = await this.prisma.child.findFirst({
      where: { id, userId },
      include: includeFavorites,
    });
    return record ? ChildMapper.toDomain(record) : null;
  }

  async create(data: CreateChildData): Promise<Child> {
    const record = await this.prisma.child.create({
      data: {
        userId: data.userId,
        name: data.name,
        age: data.age,
        photoUrl: data.photoUrl,
        speechLevel: data.speechLevel,
        difficultyLevel: data.difficultyLevel,
        unlockedCategoryIds: data.unlockedCategoryIds,
        cardSize: data.cardSize,
        favoriteCategories: data.favoriteCategoryIds
          ? { create: data.favoriteCategoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: includeFavorites,
    });
    return ChildMapper.toDomain(record);
  }

  async update(id: string, data: UpdateChildData): Promise<Child> {
    const record = await this.prisma.child.update({
      where: { id },
      data: {
        name: data.name,
        age: data.age,
        photoUrl: data.photoUrl,
        speechLevel: data.speechLevel,
        difficultyLevel: data.difficultyLevel,
        unlockedCategoryIds: data.unlockedCategoryIds,
        cardSize: data.cardSize,
        favoriteCategories:
          data.favoriteCategoryIds !== undefined
            ? {
                deleteMany: {},
                create: data.favoriteCategoryIds.map((categoryId) => ({ categoryId })),
              }
            : undefined,
      },
      include: includeFavorites,
    });
    return ChildMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.child.delete({ where: { id } });
  }
}
