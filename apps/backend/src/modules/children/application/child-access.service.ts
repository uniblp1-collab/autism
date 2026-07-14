import { Inject, Injectable } from "@nestjs/common";
import { CHILD_REPOSITORY, ChildRepository } from "../domain/child.repository";
import { EntityNotFoundException } from "../../../common/exceptions/domain.exception";

// Единая точка авторизации для всех модулей, оперирующих данными конкретного ребёнка
// (избранное, расписание, статистика, история, кастомные карточки) — без неё любой
// авторизованный родитель мог бы прочитать/изменить данные чужого ребёнка, просто зная
// (или подобрав) его id. 404, а не 403 — чтобы не подтверждать факт существования чужого id.
@Injectable()
export class ChildAccessService {
  constructor(@Inject(CHILD_REPOSITORY) private readonly childRepository: ChildRepository) {}

  async assertOwnedByUser(childId: string, userId: string): Promise<void> {
    const child = await this.childRepository.findByIdForUser(childId, userId);
    if (!child) {
      throw new EntityNotFoundException("Child", childId);
    }
  }
}
