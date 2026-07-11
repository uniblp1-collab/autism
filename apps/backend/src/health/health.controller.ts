import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  // Liveness-проверка для dev-up.sh — без обращения к БД, без авторизации (раздел 3 TASK_PREPARE_TEST_ENV.md).
  @Public()
  @Get()
  check() {
    return { status: "ok" };
  }
}
