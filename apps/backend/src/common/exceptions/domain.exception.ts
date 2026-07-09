import { HttpException, HttpStatus } from "@nestjs/common";

/** Базовый класс для всех доменных ошибок бизнес-логики (см. CLAUDE.md §4.5). */
export class DomainException extends HttpException {
  constructor(
    message: string,
    public readonly code: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} с id "${id}" не найден`, `${entity.toUpperCase()}_NOT_FOUND`, HttpStatus.NOT_FOUND);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message = "Доступ запрещён") {
    super(message, "FORBIDDEN", HttpStatus.FORBIDDEN);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(message: string, code: string) {
    super(message, code, HttpStatus.CONFLICT);
  }
}
