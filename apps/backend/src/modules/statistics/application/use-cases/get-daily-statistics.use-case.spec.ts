import { GetDailyStatisticsUseCase } from "./get-daily-statistics.use-case";
import { StatisticsRepository } from "../../domain/statistics.repository";

describe("GetDailyStatisticsUseCase", () => {
  let repository: jest.Mocked<StatisticsRepository>;
  let useCase: GetDailyStatisticsUseCase;

  beforeEach(() => {
    repository = { recordUsage: jest.fn(), findByChildInRange: jest.fn().mockResolvedValue([]) };
    useCase = new GetDailyStatisticsUseCase(repository);
  });

  it("defaults to a 30-day range ending now when no dates are provided", async () => {
    await useCase.execute({ childId: "child-1" });

    const [childId, from, to] = repository.findByChildInRange.mock.calls[0];
    expect(childId).toBe("child-1");
    const diffDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("uses the provided from/to range verbatim", async () => {
    await useCase.execute({ childId: "child-1", from: "2026-01-01", to: "2026-01-31" });

    expect(repository.findByChildInRange).toHaveBeenCalledWith(
      "child-1",
      new Date("2026-01-01"),
      new Date("2026-01-31"),
    );
  });
});
