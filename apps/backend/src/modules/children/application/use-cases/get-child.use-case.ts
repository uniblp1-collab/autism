import { Inject, Injectable } from "@nestjs/common";
import { CHILD_REPOSITORY, ChildRepository } from "../../domain/child.repository";
import { Child } from "../../domain/child.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

@Injectable()
export class GetChildUseCase {
  constructor(@Inject(CHILD_REPOSITORY) private readonly childRepository: ChildRepository) {}

  async execute(userId: string, childId: string): Promise<Child> {
    const child = await this.childRepository.findByIdForUser(childId, userId);
    if (!child) {
      throw new EntityNotFoundException("Child", childId);
    }
    return child;
  }
}
