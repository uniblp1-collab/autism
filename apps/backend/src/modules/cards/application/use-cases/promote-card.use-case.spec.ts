import { PromoteCardUseCase } from "./promote-card.use-case";
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

describe("PromoteCardUseCase", () => {
  let cardRepository: jest.Mocked<CardRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: PromoteCardUseCase;

  beforeEach(() => {
    cardRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updatePriorities: jest.fn(),
    };
    childAccessService = { assertOwnedByUser: jest.fn() };
    useCase = new PromoteCardUseCase(
      cardRepository,
      new GetCardUseCase(cardRepository),
      childAccessService as unknown as ChildAccessService,
    );
  });

  it("checks that the caller owns the child before promoting", async () => {
    const target = buildCard({ id: "card-3", priority: 1 });
    cardRepository.findById.mockResolvedValue(target);
    cardRepository.search.mockResolvedValue([target]);

    await useCase.execute("user-1", "card-3", "child-1");

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
  });

  it("throws and does not touch priorities when the child isn't owned by the caller", async () => {
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "child-1"));

    await expect(useCase.execute("someone-else", "card-3", "child-1")).rejects.toThrow(EntityNotFoundException);
    expect(cardRepository.updatePriorities).not.toHaveBeenCalled();
  });

  it("gives the target card the highest priority while preserving siblings' relative order", async () => {
    const target = buildCard({ id: "card-3", title: "Суп", priority: 1 });
    const first = buildCard({ id: "card-1", title: "Банан", priority: 5 });
    const second = buildCard({ id: "card-2", title: "Йогурт", priority: 3 });
    // Порядок, в котором репозиторий отдал бы карточки этому запросу (priority desc, title asc):
    // first (5), second (3), target (1).
    cardRepository.findById.mockResolvedValue(target);
    cardRepository.search.mockResolvedValue([first, second, target]);
    cardRepository.update.mockResolvedValue(buildCard({ id: "card-3", priority: 3 }));

    await useCase.execute("user-1", "card-3", "child-1");

    expect(cardRepository.search).toHaveBeenCalledWith({
      categoryId: "category-1",
      childId: "child-1",
      includeCustom: true,
      cardType: "NOUN",
    });
    expect(cardRepository.updatePriorities).toHaveBeenCalledWith([
      { id: "card-3", priority: 3 },
      { id: "card-1", priority: 2 },
      { id: "card-2", priority: 1 },
    ]);
  });

  it("throws when the card does not exist", async () => {
    cardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "missing", "child-1")).rejects.toThrow(EntityNotFoundException);
    expect(cardRepository.updatePriorities).not.toHaveBeenCalled();
  });
});
