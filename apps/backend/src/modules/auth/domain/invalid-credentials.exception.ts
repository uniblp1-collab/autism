import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super("Неверный email или пароль", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyRegisteredException extends DomainException {
  constructor(email: string) {
    super(`Email "${email}" уже зарегистрирован`, "EMAIL_ALREADY_REGISTERED", HttpStatus.CONFLICT);
  }
}
