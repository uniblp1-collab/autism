import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ChildrenService } from "../application/children.service";
import { CreateChildDto } from "../application/dto/create-child.dto";
import { UpdateChildDto } from "../application/dto/update-child.dto";
import { CurrentUser, CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Controller("children")
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateChildDto) {
    return this.childrenService.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.childrenService.list(user.userId);
  }

  @Get(":id")
  getOne(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.childrenService.getOne(user.userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string, @Body() dto: UpdateChildDto) {
    return this.childrenService.update(user.userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.childrenService.remove(user.userId, id);
  }
}
