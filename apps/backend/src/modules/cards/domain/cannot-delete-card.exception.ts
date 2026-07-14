import { DomainException } from "../../../common/exceptions/domain.exception";

// Родитель может удалять/редактировать любую карточку (включая библиотечные) из режима
// редактирования — явное продуктовое решение. Защищены только служебные Да/Нет
// (isSystemCard) — они структурно обязательны для механики, а не обычный контент.
export class CannotDeleteCardException extends DomainException {
  constructor() {
    super("Служебные карточки (Да/Нет) удалять нельзя", "CANNOT_DELETE_CARD", 403);
  }
}
