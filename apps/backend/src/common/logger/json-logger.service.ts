import { ConsoleLogger, Injectable, Scope } from "@nestjs/common";
import { getRequestId } from "./request-context";

/**
 * Централизованный логгер: единый JSON-формат на все сервисы (раздел 3.3 ARCHITECTURE.md).
 * requestId прокидывается через AsyncLocalStorage (см. request-context.ts) и подмешивается
 * в каждую запись автоматически, без ручной передачи в каждый вызов логгера.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class JsonLoggerService extends ConsoleLogger {
  private write(level: string, message: unknown, context?: string, extra?: Record<string, unknown>) {
    const entry = {
      level,
      message,
      context: context ?? this.context,
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
      ...extra,
    };
    // eslint-disable-next-line no-console -- единственная точка вывода логов в приложении
    console.log(JSON.stringify(entry));
  }

  log(message: unknown, context?: string) {
    this.write("log", message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write("error", message, context, trace ? { trace } : undefined);
  }

  warn(message: unknown, context?: string) {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string) {
    this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write("verbose", message, context);
  }
}
