import { User, UserRole } from "./user.entity";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
