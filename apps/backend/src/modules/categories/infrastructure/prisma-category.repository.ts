import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CategoryRepository, CreateCategoryData } from "../domain/category.repository";
import { Category } from "../domain/category.entity";
import { CategoryMapper } from "./category.mapper";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const records = await this.prisma.category.findMany({
      where: { deletedAt: null, isHiddenFromNav: false },
      orderBy: { order: "asc" },
    });
    return records.map(CategoryMapper.toDomain);
  }

  async findById(id: string): Promise<Category | null> {
    const record = await this.prisma.category.findFirst({ where: { id, deletedAt: null } });
    return record ? CategoryMapper.toDomain(record) : null;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const record = await this.prisma.category.create({ data: { ...data, isSystem: false } });
    return CategoryMapper.toDomain(record);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
