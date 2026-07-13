import { DeleteCardUseCase } from "./delete-card.use-case";
import { GetCardUseCase } from "./get-card.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { CannotDeleteCardException } from "../../domain/cannot-delete-card.exception";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

function buildCard(overrides: Partial<Card> = {}): Card {
  return new Card(
    overrides.id ?? "card-1",
    overrides.categoryId ?? "category-1",
    overrides.childId ?? "child-1",
    overrides.title ?? "Мой мишка",
    overrides.imageUrl ?? null,
    overrides.color ?? "#4F46E5",
    overrides.priority ?? 0,
    overrides.ttsText ?? "Мишка",
    overrides.phraseForm ?? "мишку",
    overrides.cardType ?? "NOUN",
    overrides.gender ?? "MASCULINE",
    overrides.phraseFormMasculine ?? null,
    overrides.phraseFormFeminine ?? null,
    overrides.phraseFormNeuter ?? null,
    overrides.source ?? "CUSTOM",
    overrides.isCustom ?? true,
    overrides.isSystemCard ?? false,
    overrides.createdAt ?? new Date(),
    overrides.updatedAt ?? new Date(),
  );
}

describe("DeleteCardUseCase", () => {
  let cardRepository: jest.Mocked<CardRepository>;
  let useCase: DeleteCardUseCase;

  beforeEach(() => {
    cardRepository = {
      findById: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    useCase = new DeleteCardUseCase(cardRepository, new GetCardUseCase(cardRepository));
  });

  it("soft-deletes a custom card belonging to a child", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: true, isSystemCard: false }));

    await useCase.execute("card-1");

    expect(cardRepository.softDelete).toHaveBeenCalledWith("card-1");
  });

  it("throws when the card does not exist", async () => {
    cardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing")).rejects.toThrow(EntityNotFoundException);
    expect(cardRepository.softDelete).not.toHaveBeenCalled();
  });

  it("allows deleting a shared library card (product decision: edit mode can manage default cards)", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: false, childId: null, source: "LIBRARY" }));

    await useCase.execute("card-1");

    expect(cardRepository.softDelete).toHaveBeenCalledWith("card-1");
  });

  it("refuses to delete a system card (Да/Нет), even if somehow flagged custom", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: true, isSystemCard: true }));

    await expect(useCase.execute("card-1")).rejects.toThrow(CannotDeleteCardException);
    expect(cardRepository.softDelete).not.toHaveBeenCalled();
  });
});
