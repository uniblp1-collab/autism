import { CreateScheduleUseCase } from "./create-schedule.use-case";
import { ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";
import { ChildAccessService } from "../../../children/application/child-access.service";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

describe("CreateScheduleUseCase", () => {
  let repository: jest.Mocked<ScheduleRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: CreateScheduleUseCase;

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
    useCase = new CreateScheduleUseCase(repository, childAccessService as unknown as ChildAccessService);
  });

  it("defaults to an empty item list when none are provided", async () => {
    repository.create.mockResolvedValue(new Schedule("s1", "child-1", "Утро", [], new Date(), new Date()));

    await useCase.execute("user-1", { childId: "child-1", title: "Утро" });

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
    expect(repository.create).toHaveBeenCalledWith({ childId: "child-1", title: "Утро", items: [] });
  });

  it("forwards provided items to the repository", async () => {
    repository.create.mockResolvedValue(new Schedule("s1", "child-1", "Утро", [], new Date(), new Date()));

    await useCase.execute("user-1", {
      childId: "child-1",
      title: "Утро",
      items: [{ title: "Проснуться", order: 0 }],
    });

    expect(repository.create).toHaveBeenCalledWith({
      childId: "child-1",
      title: "Утро",
      items: [{ title: "Проснуться", cardId: undefined, order: 0 }],
    });
  });

  it("refuses to create a schedule for a child the caller doesn't own", async () => {
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("user-1", { childId: "child-1", title: "Утро" })).rejects.toThrow(
      EntityNotFoundException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });
});
