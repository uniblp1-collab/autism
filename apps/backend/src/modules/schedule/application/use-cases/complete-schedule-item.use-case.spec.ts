import { CompleteScheduleItemUseCase } from "./complete-schedule-item.use-case";
import { ScheduleRepository } from "../../domain/schedule.repository";
import { ScheduleItem } from "../../domain/schedule-item.entity";
import { Schedule } from "../../domain/schedule.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { ChildAccessService } from "../../../children/application/child-access.service";

describe("CompleteScheduleItemUseCase", () => {
  let repository: jest.Mocked<ScheduleRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
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
    childAccessService = { assertOwnedByUser: jest.fn() };
    repository.findById.mockResolvedValue(new Schedule("schedule-1", "child-1", "Утро", [], new Date(), new Date()));
    useCase = new CompleteScheduleItemUseCase(repository, childAccessService as unknown as ChildAccessService);
  });

  it("marks the item as completed", async () => {
    repository.findItemById.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, false, null),
    );
    repository.setItemCompletion.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, true, new Date()),
    );

    const result = await useCase.execute("user-1", "item-1", true);

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
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

    const result = await useCase.execute("user-1", "item-1", false);

    expect(repository.setItemCompletion).toHaveBeenCalledWith("item-1", false);
    expect(result.completedAt).toBeNull();
  });

  it("throws when the schedule item does not exist", async () => {
    repository.findItemById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "missing", true)).rejects.toThrow(EntityNotFoundException);
    expect(repository.setItemCompletion).not.toHaveBeenCalled();
  });

  it("refuses to complete a step belonging to another user's child", async () => {
    repository.findItemById.mockResolvedValue(
      new ScheduleItem("item-1", "schedule-1", null, "Позавтракать", 0, false, null),
    );
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("someone-else", "item-1", true)).rejects.toThrow(EntityNotFoundException);
    expect(repository.setItemCompletion).not.toHaveBeenCalled();
  });
});
