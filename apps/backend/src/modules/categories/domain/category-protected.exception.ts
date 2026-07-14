import { DomainException } from "../../../common/exceptions/domain.exception";

/** Системные категории защищены от удаления через UI (раздел 2.3 DATABASE.md). */
export class SystemCategoryProtectedException extends DomainException {
  constructor(id: string) {
    super(`Категория "${id}" системная и не может быть удалена`, "CATEGORY_PROTECTED", 403);
  }
}
