import { Injectable } from "@nestjs/common";
import { Child } from "../domain/child.entity";
import { CreateChildDto } from "./dto/create-child.dto";
import { UpdateChildDto } from "./dto/update-child.dto";
import { CreateChildUseCase } from "./use-cases/create-child.use-case";
import { ListChildrenUseCase } from "./use-cases/list-children.use-case";
import { GetChildUseCase } from "./use-cases/get-child.use-case";
import { UpdateChildUseCase } from "./use-cases/update-child.use-case";
import { DeleteChildUseCase } from "./use-cases/delete-child.use-case";

@Injectable()
export class ChildrenService {
  constructor(
    private readonly createChildUseCase: CreateChildUseCase,
    private readonly listChildrenUseCase: ListChildrenUseCase,
    private readonly getChildUseCase: GetChildUseCase,
    private readonly updateChildUseCase: UpdateChildUseCase,
    private readonly deleteChildUseCase: DeleteChildUseCase,
  ) {}

  create(userId: string, dto: CreateChildDto): Promise<Child> {
    return this.createChildUseCase.execute(userId, dto);
  }

  list(userId: string): Promise<Child[]> {
    return this.listChildrenUseCase.execute(userId);
  }

  getOne(userId: string, childId: string): Promise<Child> {
    return this.getChildUseCase.execute(userId, childId);
  }

  update(userId: string, childId: string, dto: UpdateChildDto): Promise<Child> {
    return this.updateChildUseCase.execute(userId, childId, dto);
  }

  remove(userId: string, childId: string): Promise<void> {
    return this.deleteChildUseCase.execute(userId, childId);
  }
}
