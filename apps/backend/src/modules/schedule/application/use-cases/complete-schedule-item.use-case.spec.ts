import { CompleteScheduleItemUseCase } from "./complete-schedule-item.use-case";
import { ScheduleRepository } from "../../domain/schedule.repository";
import { ScheduleItem } from "../../domain/schedule-item.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

describe("CompleteScheduleItemUseCase", () => {
  let repository: jest.Mocked<ScheduleRepository>;
  let useCase: CompleteScheduleItemUseCase;

  beforeEach(() => {
    repository = {
      findByChild: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      addItem: jest.fn(),
      findItemById: jest.fn(),
      setItemCompletion: jest.fn(),
      resetAllCompletions: jest.fn(),
    };
    useCase = new CompleteScheduleItemUseCase(repository);
  });

  it("marks the item as completed", async () => {
    repository.findItemById.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, false, null),
    );
    repository.setItemCompletion.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, true, new Date()),
    );

    const result = await useCase.execute("item-1", true);

    expect(repository.setItemCompletion).toHaveBeenCalledWith("item-1", true);
    expect(result.isCompleted).toBe(true);
  });

  it("allows un-completing a step", async () => {
    repository.findItemById.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, true, new Date()),
    );
    repository.setItemCompletion.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, false, null),
    );

    const result = await useCase.execute("item-1", false);

    expect(repository.setItemCompletion).toHaveBeenCalledWith("item-1", false);
    expect(result.completedAt).toBeNull();
  });

  it("throws when the schedule item does not exist", async () => {
    repository.findItemById.mockResolvedValue(null);

    await expect(useCase.execute("missing", true)).rejects.toThrow(EntityNotFoundException);
    expect(repository.setItemCompletion).not.toHaveBeenCalled();
  });
});
