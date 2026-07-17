import { DeleteCardUseCase } from "./delete-card.use-case";
import { GetCardUseCase } from "./get-card.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { CannotDeleteCardException } from "../../domain/cannot-delete-card.exception";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { ChildAccessService } from "../../../children/application/child-access.service";
import { StorageService } from "../../../../storage/storage.service";

function buildCard(overrides: Partial<Card> = {}): Card {
  return new Card(
    overrides.id ?? "card-1",
    overrides.categoryId ?? "category-1",
    "childId" in overrides ? (overrides.childId as string | null) : "child-1",
    overrides.title ?? "Мой мишка",
    overrides.imageUrl ?? null,
    overrides.color ?? "#4F46E5",
    overrides.priority ?? 0,
    overrides.ttsText ?? "Мишка",
    overrides.ttsPhrase ?? "Мишка",
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
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let storageService: jest.Mocked<Pick<StorageService, "deleteCardImage">>;
  let useCase: DeleteCardUseCase;

  beforeEach(() => {
    cardRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    childAccessService = { assertOwnedByUser: jest.fn() };
    storageService = { deleteCardImage: jest.fn() };
    useCase = new DeleteCardUseCase(
      cardRepository,
      new GetCardUseCase(cardRepository),
      childAccessService as unknown as ChildAccessService,
      storageService as unknown as StorageService,
    );
  });

  it("soft-deletes a custom card belonging to a child owned by the caller", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: true, isSystemCard: false, childId: "child-1" }));

    await useCase.execute("user-1", "card-1");

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
    expect(cardRepository.softDelete).toHaveBeenCalledWith("card-1");
  });

  it("deletes the card's image file from disk", async () => {
    cardRepository.findById.mockResolvedValue(
      buildCard({
        isCustom: true,
        isSystemCard: false,
        childId: "child-1",
        imageUrl: "http://localhost:3001/uploads/cards/pic.png",
      }),
    );

    await useCase.execute("user-1", "card-1");

    expect(storageService.deleteCardImage).toHaveBeenCalledWith("http://localhost:3001/uploads/cards/pic.png");
  });

  it("throws when the card does not exist", async () => {
    cardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "missing")).rejects.toThrow(EntityNotFoundException);
    expect(cardRepository.softDelete).not.toHaveBeenCalled();
  });

  it("allows deleting a shared library card without an ownership check (product decision: edit mode can manage default cards)", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: false, childId: null, source: "LIBRARY" }));

    await useCase.execute("user-1", "card-1");

    expect(childAccessService.assertOwnedByUser).not.toHaveBeenCalled();
    expect(cardRepository.softDelete).toHaveBeenCalledWith("card-1");
  });

  it("refuses to delete a system card (Да/Нет), even if somehow flagged custom", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: true, isSystemCard: true, childId: null }));

    await expect(useCase.execute("user-1", "card-1")).rejects.toThrow(CannotDeleteCardException);
    expect(cardRepository.softDelete).not.toHaveBeenCalled();
  });

  it("refuses to delete another user's custom card", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ isCustom: true, isSystemCard: false, childId: "child-1" }));
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("someone-else", "card-1")).rejects.toThrow(EntityNotFoundException);
    expect(cardRepository.softDelete).not.toHaveBeenCalled();
  });
});
