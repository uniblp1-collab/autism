import { GetCardUseCase } from "./get-card.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

function buildCard(overrides: Partial<Card> = {}): Card {
  return new Card(
    overrides.id ?? "card-1",
    overrides.categoryId ?? "category-1",
    overrides.childId ?? null,
    overrides.title ?? "Яблоко",
    overrides.imageUrl ?? null,
    overrides.color ?? "#F97316",
    overrides.priority ?? 0,
    overrides.ttsText ?? "Яблоко",
    overrides.ttsPhrase ?? "Яблоко",
    overrides.phraseForm ?? "яблоко",
    overrides.cardType ?? "NOUN",
    overrides.gender ?? "NEUTER",
    overrides.phraseFormMasculine ?? null,
    overrides.phraseFormFeminine ?? null,
    overrides.phraseFormNeuter ?? null,
    overrides.source ?? "LIBRARY",
    overrides.isCustom ?? false,
    overrides.isSystemCard ?? false,
    overrides.createdAt ?? new Date(),
    overrides.updatedAt ?? new Date(),
  );
}

describe("GetCardUseCase", () => {
  let repository: jest.Mocked<CardRepository>;
  let useCase: GetCardUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updatePriorities: jest.fn(),
    };
    useCase = new GetCardUseCase(repository);
  });

  it("returns the card when it exists", async () => {
    repository.findById.mockResolvedValue(buildCard({ id: "card-1" }));

    const result = await useCase.execute("card-1");

    expect(result.id).toBe("card-1");
  });

  it("throws EntityNotFoundException when the card does not exist", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing")).rejects.toThrow(EntityNotFoundException);
  });
});
