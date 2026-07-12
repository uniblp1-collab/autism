import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";

// Область B техзадания ограничена управлением аккаунтами role=PARENT — админ не может
// заблокировать/сбросить пароль другому ADMIN или SPECIALIST через этот эндпоинт.
export class OnlyParentAccountsManageableException extends DomainException {
  constructor() {
    super("Через админ-панель управляются только аккаунты родителей", "ONLY_PARENT_ACCOUNTS", HttpStatus.FORBIDDEN);
  }
}
