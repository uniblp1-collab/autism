import { UploadCardImageUseCase } from "./upload-card-image.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { StorageService } from "../../../../storage/storage.service";
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

function buildFile(): Express.Multer.File {
  return { mimetype: "image/png", size: 1024, buffer: Buffer.from("fake") } as Express.Multer.File;
}

describe("UploadCardImageUseCase", () => {
  let cardRepository: jest.Mocked<CardRepository>;
  let storageService: jest.Mocked<Pick<StorageService, "uploadCardImage">>;
  let useCase: UploadCardImageUseCase;

  beforeEach(() => {
    cardRepository = {
      findById: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    storageService = { uploadCardImage: jest.fn() };
    useCase = new UploadCardImageUseCase(cardRepository, storageService as unknown as StorageService);
  });

  it("uploads the image and updates the card's imageUrl", async () => {
    cardRepository.findById.mockResolvedValue(buildCard());
    storageService.uploadCardImage.mockResolvedValue("http://localhost:9000/bucket/cards/new.png");
    cardRepository.update.mockResolvedValue(buildCard({ imageUrl: "http://localhost:9000/bucket/cards/new.png" }));

    const file = buildFile();
    const result = await useCase.execute("card-1", file);

    expect(storageService.uploadCardImage).toHaveBeenCalledWith(file);
    expect(cardRepository.update).toHaveBeenCalledWith("card-1", {
      imageUrl: "http://localhost:9000/bucket/cards/new.png",
    });
    expect(result.imageUrl).toBe("http://localhost:9000/bucket/cards/new.png");
  });

  it("throws when the card does not exist, without touching storage", async () => {
    cardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing", buildFile())).rejects.toThrow(EntityNotFoundException);
    expect(storageService.uploadCardImage).not.toHaveBeenCalled();
  });
});
