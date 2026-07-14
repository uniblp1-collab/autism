import { Injectable } from "@nestjs/common";
import { HistoryEntry } from "../domain/history-entry.entity";
import { CreateHistoryDto } from "./dto/create-history.dto";
import { CreateHistoryUseCase } from "./use-cases/create-history.use-case";
import { ListHistoryUseCase } from "./use-cases/list-history.use-case";
import { ChildAccessService } from "../../children/application/child-access.service";

@Injectable()
export class HistoryService {
  constructor(
    private readonly createHistoryUseCase: CreateHistoryUseCase,
    private readonly listHistoryUseCase: ListHistoryUseCase,
    private readonly childAccessService: ChildAccessService,
  ) {}

  async create(userId: string, dto: CreateHistoryDto): Promise<HistoryEntry> {
    await this.childAccessService.assertOwnedByUser(dto.childId, userId);
    return this.createHistoryUseCase.execute(dto);
  }

  async list(userId: string, childId: string): Promise<HistoryEntry[]> {
    await this.childAccessService.assertOwnedByUser(childId, userId);
    return this.listHistoryUseCase.execute(childId);
  }
}
