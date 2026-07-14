import { ListSchedulesUseCase } from "./list-schedules.use-case";
import { ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";
import { ChildAccessService } from "../../../children/application/child-access.service";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

describe("ListSchedulesUseCase", () => {
  let repository: jest.Mocked<ScheduleRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: ListSchedulesUseCase;

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
    useCase = new ListSchedulesUseCase(repository, childAccessService as unknown as ChildAccessService);
  });

  it("returns schedules for a child owned by the caller", async () => {
    const schedules = [new Schedule("s1", "child-1", "Утро", [], new Date(), new Date())];
    repository.findByChild.mockResolvedValue(schedules);

    const result = await useCase.execute("user-1", "child-1");

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
    expect(result).toBe(schedules);
  });

  it("refuses to list schedules for a child the caller doesn't own", async () => {
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("someone-else", "child-1")).rejects.toThrow(EntityNotFoundException);
    expect(repository.findByChild).not.toHaveBeenCalled();
  });
});
