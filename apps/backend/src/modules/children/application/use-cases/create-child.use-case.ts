import { Inject, Injectable } from "@nestjs/common";
import { CHILD_REPOSITORY, ChildRepository } from "../../domain/child.repository";
import { Child } from "../../domain/child.entity";
import { CreateChildDto } from "../dto/create-child.dto";

@Injectable()
export class CreateChildUseCase {
  constructor(@Inject(CHILD_REPOSITORY) private readonly childRepository: ChildRepository) {}

  execute(userId: string, dto: CreateChildDto): Promise<Child> {
    return this.childRepository.create({
      userId,
      name: dto.name,
      age: dto.age,
      photoUrl: dto.photoUrl ?? null,
      speechLevel: dto.speechLevel,
      favoriteCategoryIds: dto.favoriteCategoryIds,
    });
  }
}
