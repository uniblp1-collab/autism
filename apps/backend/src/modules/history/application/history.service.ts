import { Injectable } from "@nestjs/common";
import { HistoryEntry } from "../domain/history-entry.entity";
import { CreateHistoryDto } from "./dto/create-history.dto";
import { CreateHistoryUseCase } from "./use-cases/create-history.use-case";
import { ListHistoryUseCase } from "./use-cases/list-history.use-case";

@Injectable()
export class HistoryService {
  constructor(
    private readonly createHistoryUseCase: CreateHistoryUseCase,
    private readonly listHistoryUseCase: ListHistoryUseCase,
  ) {}

  create(dto: CreateHistoryDto): Promise<HistoryEntry> {
    return this.createHistoryUseCase.execute(dto);
  }

  list(childId: string): Promise<HistoryEntry[]> {
    return this.listHistoryUseCase.execute(childId);
  }
}
