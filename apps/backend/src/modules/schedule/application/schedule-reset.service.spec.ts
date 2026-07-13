import { ScheduleResetService } from "./schedule-reset.service";
import { ScheduleRepository } from "../domain/schedule.repository";

describe("ScheduleResetService", () => {
  let scheduleRepository: jest.Mocked<ScheduleRepository>;
  let service: ScheduleResetService;

  beforeEach(() => {
    scheduleRepository = {
      findByChild: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      addItem: jest.fn(),
      findItemById: jest.fn(),
      setItemCompletion: jest.fn(),
      resetAllCompletions: jest.fn(),
    };
    service = new ScheduleResetService(scheduleRepository);
  });

  it("resets all schedule item completions via the repository", async () => {
    await service.resetDailySchedules();

    expect(scheduleRepository.resetAllCompletions).toHaveBeenCalledTimes(1);
  });
});
