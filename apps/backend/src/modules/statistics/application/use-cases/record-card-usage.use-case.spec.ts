import { RecordCardUsageUseCase } from "./record-card-usage.use-case";
import { StatisticsRepository } from "../../domain/statistics.repository";

describe("RecordCardUsageUseCase", () => {
  let repository: jest.Mocked<StatisticsRepository>;
  let useCase: RecordCardUsageUseCase;

  beforeEach(() => {
    repository = { recordUsage: jest.fn(), findByChildInRange: jest.fn() };
    useCase = new RecordCardUsageUseCase(repository);
  });

  it("normalizes the timestamp to the start of the UTC day", async () => {
    const now = new Date("2026-07-09T18:42:31.000Z");

    await useCase.execute({ childId: "child-1", cardId: "card-1" }, now);

    expect(repository.recordUsage).toHaveBeenCalledWith(
      "child-1",
      "card-1",
      new Date("2026-07-09T00:00:00.000Z"),
    );
  });
});
