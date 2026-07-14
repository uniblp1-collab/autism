import { CreateCardUseCase } from "./create-card.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { CreateCardDto } from "../dto/create-card.dto";
import { ChildAccessService } from "../../../children/application/child-access.service";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

function buildCard(overrides: Partial<Card> = {}): Card {
  return new Card(
    overrides.id ?? "card-1",
    overrides.categoryId ?? "category-1",
    overrides.childId ?? null,
    overrides.title ?? "Яблоко",
    overrides.imageUrl ?? "/cards/food/apple.svg",
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

describe("CreateCardUseCase", () => {
  let repository: jest.Mocked<CardRepository>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: CreateCardUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    childAccessService = { assertOwnedByUser: jest.fn() };
    useCase = new CreateCardUseCase(repository, childAccessService as unknown as ChildAccessService);
  });

  it("creates a LIBRARY card when no childId is provided, without checking ownership", async () => {
    const dto: CreateCardDto = {
      categoryId: "category-1",
      title: "Яблоко",
      imageUrl: "/cards/food/apple.svg",
      ttsText: "Яблоко",
      phraseForm: "яблоко",
    };
    repository.create.mockResolvedValue(buildCard());

    await useCase.execute("user-1", dto);

    expect(childAccessService.assertOwnedByUser).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: "LIBRARY", isCustom: false, childId: null }),
    );
  });

  it("creates a CUSTOM card scoped to a child when childId is provided and owned by the caller", async () => {
    const dto: CreateCardDto = {
      categoryId: "category-1",
      childId: "child-1",
      title: "Любимый мишка",
      imageUrl: "/cards/custom/bear.svg",
      ttsText: "Мишка",
      phraseForm: "мишку",
    };
    repository.create.mockResolvedValue(buildCard({ childId: "child-1", isCustom: true, source: "CUSTOM" }));

    await useCase.execute("user-1", dto);

    expect(childAccessService.assertOwnedByUser).toHaveBeenCalledWith("child-1", "user-1");
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: "CUSTOM", isCustom: true, childId: "child-1" }),
    );
  });

  it("refuses to create a custom card scoped to a child the caller doesn't own", async () => {
    const dto: CreateCardDto = {
      categoryId: "category-1",
      childId: "someone-elses-child",
      title: "Любимый мишка",
      ttsText: "Мишка",
      phraseForm: "мишку",
    };
    childAccessService.assertOwnedByUser.mockRejectedValue(new EntityNotFoundException("Child", "someone-elses-child"));

    await expect(useCase.execute("user-1", dto)).rejects.toThrow(EntityNotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
