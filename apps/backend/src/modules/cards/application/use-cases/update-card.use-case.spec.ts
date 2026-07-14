import { UpdateCardUseCase } from "./update-card.use-case";
import { GetCardUseCase } from "./get-card.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { ChildAccessService } from "../../../children/application/child-access.service";

function buildCard(overrides: Partial<Card> = {}): Card {
  return new Card(
    overrides.id ?? "card-1",
    overrides.categoryId ?? "category-1",
    "childId" in overrides ? (overrides.childId as string | null) : null,
    overrides.title ?? "Яблоко",
    overrides.imageUrl ?? null,
    overrides.color ?? "#F97316",
    overrides.priority ?? 0,
    overrides.ttsText ?? "Яблоко",
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

describe("UpdateCardUseCase", () => {
  let cardRepository: jest.Mocked<CardRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: UpdateCardUseCase;

  beforeEach(() => {
    cardRepository = {
      findById: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    childAccessService = { assertOwnedByUser: jest.fn() };
    useCase = new UpdateCardUseCase(
      cardRepository,
      new GetCardUseCase(cardRepository),
      childAccessService as unknown as ChildAccessService,
    );
  });

  it("updates a shared library card without an ownership check", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ childId: null }));
    cardRepository.update.mockResolvedValue(buildCard({ childId: null, title: "Новое" }));

    const result = await useCase.execute("user-1", "card-1", { title: "Новое" });

    expect(childAccessService.assertOwnedByUser).not.toHaveBeenCalled();
    expect(cardRepository.update).toHaveBeenCalledWith("card-1", { title: "Новое" });
    expect(result.title).toBe("Новое");
  });

  it("updates a custom card belonging to a child owned by the caller", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ childId: "child-1" }));
    cardRepository.update.mockResolvedValue(buildCard({ childId: "child-1" }));

    await useCase.execute("user-1", "card-1", { title: "Новое" });

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
  });

  it("throws when the card does not exist", async () => {
    cardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "missing", { title: "Новое" })).rejects.toThrow(EntityNotFoundException);
    expect(cardRepository.update).not.toHaveBeenCalled();
  });

  it("refuses to update another user's custom card", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ childId: "child-1" }));
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("someone-else", "card-1", { title: "Новое" })).rejects.toThrow(
      EntityNotFoundException,
    );
    expect(cardRepository.update).not.toHaveBeenCalled();
  });
});
