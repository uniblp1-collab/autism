import { Module } from "@nestjs/common";
import { ChildrenController } from "./children.controller";
import { ChildrenService } from "../application/children.service";
import { CreateChildUseCase } from "../application/use-cases/create-child.use-case";
import { ListChildrenUseCase } from "../application/use-cases/list-children.use-case";
import { GetChildUseCase } from "../application/use-cases/get-child.use-case";
import { UpdateChildUseCase } from "../application/use-cases/update-child.use-case";
import { DeleteChildUseCase } from "../application/use-cases/delete-child.use-case";
import { CHILD_REPOSITORY } from "../domain/child.repository";
import { PrismaChildRepository } from "../infrastructure/prisma-child.repository";

@Module({
  controllers: [ChildrenController],
  providers: [
    ChildrenService,
    CreateChildUseCase,
    ListChildrenUseCase,
    GetChildUseCase,
    UpdateChildUseCase,
    DeleteChildUseCase,
    { provide: CHILD_REPOSITORY, useClass: PrismaChildRepository },
  ],
  exports: [CHILD_REPOSITORY],
})
export class ChildrenModule {}
