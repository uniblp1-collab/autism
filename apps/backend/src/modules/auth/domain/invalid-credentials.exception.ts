import { DomainException } from "../../../common/exceptions/domain.exception";

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super("Неверный email или пароль", "INVALID_CREDENTIALS", 401);
  }
}

export class EmailAlreadyRegisteredException extends DomainException {
  constructor(email: string) {
    super(`Email "${email}" уже зарегистрирован`, "EMAIL_ALREADY_REGISTERED", 409);
  }
}

// Проверяется в AuthService (login/refresh), а не только отдельным guard'ом,
// чтобы заблокированный пользователь не мог получить новые токены никаким путём.
export class AccountBlockedException extends DomainException {
  constructor() {
    super("Аккаунт заблокирован администратором", "ACCOUNT_BLOCKED", 403);
  }
}
