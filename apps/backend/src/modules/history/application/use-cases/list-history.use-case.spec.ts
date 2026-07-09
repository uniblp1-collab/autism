import { ListHistoryUseCase } from "./list-history.use-case";
import { HistoryRepository, MAX_HISTORY_ENTRIES_PER_CHILD } from "../../domain/history.repository";

describe("ListHistoryUseCase", () => {
  it("requests at most the last 100 entries for the child", async () => {
    const historyRepository: jest.Mocked<HistoryRepository> = {
      create: jest.fn(),
      findRecentByChild: jest.fn().mockResolvedValue([]),
      countByChild: jest.fn(),
      deleteOldestBeyond: jest.fn(),
    };
    const useCase = new ListHistoryUseCase(historyRepository);

    await useCase.execute("child-1");

    expect(historyRepository.findRecentByChild).toHaveBeenCalledWith("child-1", MAX_HISTORY_ENTRIES_PER_CHILD);
  });
});
