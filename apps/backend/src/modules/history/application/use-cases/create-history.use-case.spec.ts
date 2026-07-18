import { CreateHistoryUseCase } from "./create-history.use-case";
import { HistoryRepository, MAX_HISTORY_ENTRIES_PER_CHILD } from "../../domain/history.repository";
import { HistoryEntry } from "../../domain/history-entry.entity";
import { CardRepository } from "../../../cards/domain/card.repository";
import { Card } from "../../../cards/domain/card.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";

function buildCard(id: string, ttsText: string): Card {
  return new Card(
    id,
    "category-1",
    null,
    ttsText,
    "/img.svg",
    "#000",
    0,
    ttsText,
    ttsText,
    ttsText,
    "NOUN",
    null,
    null,
    null,
    null,
    "LIBRARY",
    false,
    false,
    new Date(),
    new Date(),
  );
}

describe("CreateHistoryUseCase", () => {
  let historyRepository: jest.Mocked<HistoryRepository>;
  let cardRepository: jest.Mocked<CardRepository>;
  let useCase: CreateHistoryUseCase;

  beforeEach(() => {
    historyRepository = {
      create: jest.fn(),
      findRecentByChild: jest.fn(),
      countByChild: jest.fn(),
      deleteOldestBeyond: jest.fn(),
    };
    cardRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updatePriorities: jest.fn(),
    };
    useCase = new CreateHistoryUseCase(historyRepository, cardRepository);
  });

  it("joins card TTS texts in order to build the sentence", async () => {
    cardRepository.findByIds.mockResolvedValue([buildCard("card-1", "Хочу"), buildCard("card-2", "Яблоко")]);
    historyRepository.create.mockResolvedValue(
      new HistoryEntry("h1", "child-1", "Хочу Яблоко", ["card-1", "card-2"], new Date()),
    );
    historyRepository.countByChild.mockResolvedValue(1);

    await useCase.execute({ childId: "child-1", cardIds: ["card-1", "card-2"] });

    expect(historyRepository.create).toHaveBeenCalledWith("child-1", "Хочу Яблоко", ["card-1", "card-2"]);
  });

  it("uses the explicit sentenceText override instead of joining card TTS texts", async () => {
    cardRepository.findByIds.mockResolvedValue([buildCard("card-1", "Дай"), buildCard("card-2", "яблоко")]);
    historyRepository.create.mockResolvedValue(
      new HistoryEntry("h1", "child-1", "Дай зелёное яблоко", ["card-1", "card-2"], new Date()),
    );
    historyRepository.countByChild.mockResolvedValue(1);

    await useCase.execute({
      childId: "child-1",
      cardIds: ["card-1", "card-2"],
      sentenceText: "Дай зелёное яблоко",
    });

    expect(historyRepository.create).toHaveBeenCalledWith("child-1", "Дай зелёное яблоко", [
      "card-1",
      "card-2",
    ]);
  });

  it("throws when a referenced card does not exist", async () => {
    cardRepository.findByIds.mockResolvedValue([]);

    await expect(useCase.execute({ childId: "child-1", cardIds: ["missing"] })).rejects.toThrow(
      EntityNotFoundException,
    );
    expect(historyRepository.create).not.toHaveBeenCalled();
  });

  it("prunes entries beyond the 100-item limit after creating a new one", async () => {
    cardRepository.findByIds.mockResolvedValue([buildCard("card-1", "Привет")]);
    historyRepository.create.mockResolvedValue(
      new HistoryEntry("h1", "child-1", "Привет", ["card-1"], new Date()),
    );
    historyRepository.countByChild.mockResolvedValue(MAX_HISTORY_ENTRIES_PER_CHILD + 1);

    await useCase.execute({ childId: "child-1", cardIds: ["card-1"] });

    expect(historyRepository.deleteOldestBeyond).toHaveBeenCalledWith("child-1", MAX_HISTORY_ENTRIES_PER_CHILD);
  });

  it("does not prune when within the limit", async () => {
    cardRepository.findByIds.mockResolvedValue([buildCard("card-1", "Привет")]);
    historyRepository.create.mockResolvedValue(
      new HistoryEntry("h1", "child-1", "Привет", ["card-1"], new Date()),
    );
    historyRepository.countByChild.mockResolvedValue(5);

    await useCase.execute({ childId: "child-1", cardIds: ["card-1"] });

    expect(historyRepository.deleteOldestBeyond).not.toHaveBeenCalled();
  });
});
