import { SearchCardsUseCase } from "./search-cards.use-case";
import { CardRepository } from "../../domain/card.repository";
import { SearchCardsDto } from "../dto/search-cards.dto";

describe("SearchCardsUseCase", () => {
  let repository: jest.Mocked<CardRepository>;
  let useCase: SearchCardsUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    useCase = new SearchCardsUseCase(repository);
  });

  it("delegates filters to the repository unchanged", async () => {
    const dto: SearchCardsDto = { categoryId: "category-1", childId: "child-1", query: "яб", includeCustom: true };

    await useCase.execute(dto);

    expect(repository.search).toHaveBeenCalledWith({
      categoryId: "category-1",
      childId: "child-1",
      query: "яб",
      includeCustom: true,
      cardType: undefined,
      isSystemCard: undefined,
    });
  });

  it("delegates cardType and isSystemCard to the repository (редакция 3 механики)", async () => {
    const dto: SearchCardsDto = { cardType: "ADJECTIVE" as SearchCardsDto["cardType"], isSystemCard: true };

    await useCase.execute(dto);

    expect(repository.search).toHaveBeenCalledWith(
      expect.objectContaining({ cardType: "ADJECTIVE", isSystemCard: true }),
    );
  });

  it("returns an empty list when nothing matches", async () => {
    const result = await useCase.execute({});
    expect(result).toEqual([]);
  });
});
