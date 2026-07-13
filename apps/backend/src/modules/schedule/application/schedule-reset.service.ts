import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SCHEDULE_REPOSITORY, ScheduleRepository } from "../domain/schedule.repository";

/**
 * ТЗ §6.11: отметки о выполнении шагов расписания обнуляются раз в сутки — фоновой задачей,
 * не действием пользователя (ребёнок начинает расписание заново независимо от того, кто и
 * когда зайдёт в приложение).
 *
 * TODO(открытый вопрос к заказчику, TASK_PATCH_1.md §5): EVERY_DAY_AT_MIDNIGHT срабатывает
 * по времени процесса (переменная окружения TZ, см. .env.example) — по умолчанию UTC, что
 * НЕ совпадает с полночью по Москве или другому региону целевой аудитории. Нужно подтверждение
 * часового пояса перед продакшен-деплоем; менять — через TZ в .env, без изменения кода.
 */
@Injectable()
export class ScheduleResetService {
  private readonly logger = new Logger(ScheduleResetService.name);

  constructor(@Inject(SCHEDULE_REPOSITORY) private readonly scheduleRepository: ScheduleRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailySchedules(): Promise<void> {
    await this.scheduleRepository.resetAllCompletions();
    this.logger.log("Ежедневный сброс отметок расписания выполнен");
  }
}
