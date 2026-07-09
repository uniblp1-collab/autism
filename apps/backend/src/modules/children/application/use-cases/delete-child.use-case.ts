import { Inject, Injectable } from "@nestjs/common";
import { CHILD_REPOSITORY, ChildRepository } from "../../domain/child.repository";
import { GetChildUseCase } from "./get-child.use-case";

@Injectable()
export class DeleteChildUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY) private readonly childRepository: ChildRepository,
    private readonly getChildUseCase: GetChildUseCase,
  ) {}

  async execute(userId: string, childId: string): Promise<void> {
    await this.getChildUseCase.execute(userId, childId);
    await this.childRepository.delete(childId);
  }
}
