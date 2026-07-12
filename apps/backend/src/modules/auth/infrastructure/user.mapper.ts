import { User as PrismaUser } from "@autism-connect/database";
import { User } from "../domain/user.entity";

export class UserMapper {
  static toDomain(record: PrismaUser): User {
    return new User(
      record.id,
      record.email,
      record.passwordHash,
      record.role,
      record.isActive,
      record.createdAt,
      record.updatedAt,
    );
  }
}
