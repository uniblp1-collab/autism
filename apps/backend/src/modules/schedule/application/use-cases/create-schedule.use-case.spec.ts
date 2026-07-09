import { CreateScheduleUseCase } from "./create-schedule.use-case";
import { ScheduleRepository } from "../../domain/schedule.repository";
import { Schedule } from "../../domain/schedule.entity";

describe("CreateScheduleUseCase", () => {
  let repository: jest.Mocked<ScheduleRepository>;
  let useCase: CreateScheduleUseCase;

  beforeEach(() => {
    repository = {
      findByChild: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      addItem: jest.fn(),
      findItemById: jest.fn(),
      setItemCompletion: jest.fn(),
    };
    useCase = new CreateScheduleUseCase(repository);
  });

  it("defaults to an empty item list when none are provided", async () => {
    repository.create.mockResolvedValue(new Schedule("s1", "child-1", "Утро", [], new Date(), new Date()));

    await useCase.execute({ childId: "child-1", title: "Утро" });

    expect(repository.create).toHaveBeenCalledWith({ childId: "child-1", title: "Утро", items: [] });
  });

  it("forwards provided items to the repository", async () => {
    repository.create.mockResolvedValue(new Schedule("s1", "child-1", "Утро", [], new Date(), new Date()));

    await useCase.execute({
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
});
