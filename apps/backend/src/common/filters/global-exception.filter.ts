import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { DomainException } from "../exceptions/domain.exception";

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  code: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, code } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const body: ErrorResponseBody = { statusCode, message, code };
    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): ErrorResponseBody {
    if (exception instanceof DomainException) {
      return { statusCode: exception.statusCode, message: exception.message, code: exception.code };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === "string"
          ? response
          : ((response as { message?: string | string[] }).message ?? exception.message);
      return { statusCode: status, message, code: HttpStatus[status] ?? "HTTP_ERROR" };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Внутренняя ошибка сервера",
      code: "INTERNAL_ERROR",
    };
  }
}
