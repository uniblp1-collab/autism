import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, UserRepository } from "../../../auth/domain/user.repository";
import { User } from "../../../auth/domain/user.entity";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(query: ListUsersQueryDto): Promise<PaginatedUsers> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const { items, total } = await this.userRepository.findParents({ page, pageSize });

    return { items, total, page, pageSize };
  }
}
