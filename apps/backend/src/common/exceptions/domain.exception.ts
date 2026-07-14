// Намеренно НЕ extends HttpException (@nestjs/common) — доменные ошибки описывают нарушение
// бизнес-правила и не должны знать, что их доставят по HTTP через Nest (см. CLAUDE.md §3:
// "domain не импортирует ничего из infrastructure или presentation"). Перевод в конкретный
// HTTP-статус — забота presentation-слоя (см. GlobalExceptionFilter), поэтому здесь только
// простое число, а не HttpStatus. Числовые значения ниже — стандартные коды HTTP.
/** Базовый класс для всех доменных ошибок бизнес-логики (см. CLAUDE.md §4.5). */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} с id "${id}" не найден`, `${entity.toUpperCase()}_NOT_FOUND`, 404);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message = "Доступ запрещён") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(message: string, code: string) {
    super(message, code, 409);
  }
}
