import { User, UserRole } from "./user.entity";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface FindParentsParams {
  page: number;
  pageSize: number;
}

export interface FindParentsResult {
  items: User[];
  total: number;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  setActive(id: string, isActive: boolean): Promise<User>;
  setPasswordHash(id: string, passwordHash: string): Promise<User>;
  // Только role=PARENT — это единственная категория аккаунтов, которой управляет
  // админ-панель в MVP (см. ограничение области B в техзадании).
  findParents(params: FindParentsParams): Promise<FindParentsResult>;
}
