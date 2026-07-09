import { Inject, Injectable } from "@nestjs/common";
import { CHILD_REPOSITORY, ChildRepository } from "../../domain/child.repository";
import { Child } from "../../domain/child.entity";
import { UpdateChildDto } from "../dto/update-child.dto";
import { GetChildUseCase } from "./get-child.use-case";

@Injectable()
export class UpdateChildUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY) private readonly childRepository: ChildRepository,
    private readonly getChildUseCase: GetChildUseCase,
  ) {}

  async execute(userId: string, childId: string, dto: UpdateChildDto): Promise<Child> {
    await this.getChildUseCase.execute(userId, childId);
    return this.childRepository.update(childId, dto);
  }
}
