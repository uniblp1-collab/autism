import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateUserData, UserRepository } from "../domain/user.repository";
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
}
