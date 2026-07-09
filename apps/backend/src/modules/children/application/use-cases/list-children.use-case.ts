import { Inject, Injectable } from "@nestjs/common";
import { CHILD_REPOSITORY, ChildRepository } from "../../domain/child.repository";
import { Child } from "../../domain/child.entity";

@Injectable()
export class ListChildrenUseCase {
  constructor(@Inject(CHILD_REPOSITORY) private readonly childRepository: ChildRepository) {}

  execute(userId: string): Promise<Child[]> {
    return this.childRepository.findByUserId(userId);
  }
}
