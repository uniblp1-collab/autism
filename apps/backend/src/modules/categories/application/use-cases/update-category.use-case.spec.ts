import { UpdateCategoryUseCase } from "./update-category.use-case";
import { CategoryRepository } from "../../domain/category.repository";
import { Category } from "../../domain/category.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

function buildCategory(overrides: Partial<Category> = {}): Category {
  return new Category(
    overrides.id ?? "category-1",
    overrides.title ?? "Дай",
    overrides.icon ?? "gift",
    overrides.color ?? "#4F46E5",
    overrides.order ?? 1,
    overrides.isSystem ?? true,
    overrides.isPrimary ?? true,
    overrides.isHiddenFromNav ?? false,
    overrides.phraseForm ?? "Дай",
    overrides.sentenceTemplate ?? "{verb} {noun}",
    overrides.createdAt ?? new Date(),
  );
}

describe("UpdateCategoryUseCase", () => {
  let repository: jest.Mocked<CategoryRepository>;
  let useCase: UpdateCategoryUseCase;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    useCase = new UpdateCategoryUseCase(repository);
  });

  it("updates the voicing (phraseForm) of an existing category", async () => {
    repository.findById.mockResolvedValue(buildCategory({ id: "go", phraseForm: "Пойдём" }));
    repository.update.mockResolvedValue(buildCategory({ id: "go", phraseForm: "Идём" }));

    const result = await useCase.execute("go", { phraseForm: "Идём" });

    expect(repository.update).toHaveBeenCalledWith("go", { phraseForm: "Идём" });
    expect(result.phraseForm).toBe("Идём");
  });

  it("allows editing a system category (unlike deletion)", async () => {
    repository.findById.mockResolvedValue(buildCategory({ id: "give", isSystem: true }));
    repository.update.mockResolvedValue(buildCategory({ id: "give", title: "Дай!" }));

    await expect(useCase.execute("give", { title: "Дай!" })).resolves.toBeDefined();
    expect(repository.update).toHaveBeenCalled();
  });

  it("throws EntityNotFoundException when the category does not exist", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing", { title: "X" })).rejects.toThrow(EntityNotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
