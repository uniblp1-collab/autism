import { AddScheduleItemUseCase } from "./add-schedule-item.use-case";
import { ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { ChildAccessService } from "../../../children/application/child-access.service";

describe("AddScheduleItemUseCase", () => {
  let repository: jest.Mocked<ScheduleRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: AddScheduleItemUseCase;

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
    useCase = new AddScheduleItemUseCase(repository, childAccessService as unknown as ChildAccessService);
  });

  it("adds an item to a schedule belonging to a child owned by the caller", async () => {
    repository.findById.mockResolvedValue(new Schedule("schedule-1", "child-1", "Утро", [], new Date(), new Date()));
    const updated = new Schedule("schedule-1", "child-1", "Утро", [], new Date(), new Date());
    repository.addItem.mockResolvedValue(updated);

    const result = await useCase.execute("user-1", "schedule-1", { title: "Почистить зубы", order: 1 });

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
    expect(repository.addItem).toHaveBeenCalledWith("schedule-1", { title: "Почистить зубы", order: 1 });
    expect(result).toBe(updated);
  });

  it("throws when the schedule does not exist", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "missing", { title: "Шаг", order: 0 })).rejects.toThrow(
      EntityNotFoundException,
    );
    expect(repository.addItem).not.toHaveBeenCalled();
  });

  it("refuses to add an item to another user's child's schedule", async () => {
    repository.findById.mockResolvedValue(new Schedule("schedule-1", "child-1", "Утро", [], new Date(), new Date()));
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("someone-else", "schedule-1", { title: "Шаг", order: 0 })).rejects.toThrow(
      EntityNotFoundException,
    );
    expect(repository.addItem).not.toHaveBeenCalled();
  });
});
