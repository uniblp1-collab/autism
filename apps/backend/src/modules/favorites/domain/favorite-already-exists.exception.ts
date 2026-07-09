import { ConflictDomainException } from "../../../common/exceptions/domain.exception";

export class FavoriteAlreadyExistsException extends ConflictDomainException {
  constructor() {
    super("Карточка уже в избранном у этого ребёнка", "FAVORITE_ALREADY_EXISTS");
  }
}
