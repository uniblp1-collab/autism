import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateUserData, FindParentsParams, FindParentsResult, UserRepository } from "../domain/user.repository";
import { User } from "../domain/user.entity";
import { UserMapper } from "./user.mapper";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const record = await this.prisma.user.create({ data });
    return UserMapper.toDomain(record);
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    const record = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return UserMapper.toDomain(record);
  }

  async setPasswordHash(id: string, passwordHash: string): Promise<User> {
    const record = await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return UserMapper.toDomain(record);
  }

  async findParents(params: FindParentsParams): Promise<FindParentsResult> {
    const where = { role: "PARENT" as const };
    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: records.map(UserMapper.toDomain), total };
  }
}
