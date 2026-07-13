import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";

// TASK_PATCH_1.md §4: удаление из режима редактирования экрана ребёнка допустимо только для
// кастомной карточки конкретного ребёнка (Card.isCustom) — иначе одно нажатие "удалить" в
// профиле одного ребёнка стирало бы общую библиотечную карточку у всех детей сразу.
// Служебные Да/Нет (isSystemCard) не подлежат удалению вовсе.
export class CannotDeleteCardException extends DomainException {
  constructor() {
    super(
      "Удалять можно только собственные (кастомные) карточки ребёнка — библиотечные и служебные карточки защищены",
      "CANNOT_DELETE_CARD",
      HttpStatus.FORBIDDEN,
    );
  }
}
