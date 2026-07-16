import { UploadCardImageUseCase } from "./upload-card-image.use-case";
import { CardRepository } from "../../domain/card.repository";
import { Card } from "../../domain/card.entity";
import { StorageService } from "../../../../storage/storage.service";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { ChildAccessService } from "../../../children/application/child-access.service";

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
  let storageService: jest.Mocked<Pick<StorageService, "uploadCardImage" | "deleteCardImage">>;
  let childAccessService: jest.Mocked<Pick<ChildAccessService, "assertOwnedByUser">>;
  let useCase: UploadCardImageUseCase;

  beforeEach(() => {
    cardRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    storageService = { uploadCardImage: jest.fn(), deleteCardImage: jest.fn() };
    childAccessService = { assertOwnedByUser: jest.fn() };
    useCase = new UploadCardImageUseCase(
      cardRepository,
      storageService as unknown as StorageService,
      childAccessService as unknown as ChildAccessService,
    );
  });

  it("uploads the image and updates the card's imageUrl", async () => {
    cardRepository.findById.mockResolvedValue(buildCard());
    storageService.uploadCardImage.mockResolvedValue("/uploads/cards/new.png");
    cardRepository.update.mockResolvedValue(buildCard({ imageUrl: "/uploads/cards/new.png" }));

    const file = buildFile();
    const result = await useCase.execute("card-1", file);

    expect(storageService.uploadCardImage).toHaveBeenCalledWith(file);
    expect(cardRepository.update).toHaveBeenCalledWith("card-1", {
      imageUrl: "/uploads/cards/new.png",
    });
    expect(result.imageUrl).toBe("/uploads/cards/new.png");
  });

  it("deletes the previous image file from disk after replacing it", async () => {
    cardRepository.findById.mockResolvedValue(
      buildCard({ imageUrl: "/uploads/cards/old.png" }),
    );
    storageService.uploadCardImage.mockResolvedValue("/uploads/cards/new.png");
    cardRepository.update.mockResolvedValue(buildCard({ imageUrl: "/uploads/cards/new.png" }));

    await useCase.execute("card-1", buildFile());

    expect(storageService.deleteCardImage).toHaveBeenCalledWith("/uploads/cards/old.png");
  });

  it("does not attempt to delete anything when the card had no previous image", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ imageUrl: null }));
    storageService.uploadCardImage.mockResolvedValue("/uploads/cards/new.png");
    cardRepository.update.mockResolvedValue(buildCard({ imageUrl: "/uploads/cards/new.png" }));

    await useCase.execute("card-1", buildFile());

    expect(storageService.deleteCardImage).toHaveBeenCalledWith(null);
  });

  it("throws when the card does not exist, without touching storage", async () => {
    cardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing", buildFile())).rejects.toThrow(EntityNotFoundException);
    expect(storageService.uploadCardImage).not.toHaveBeenCalled();
  });

  it("skips the ownership check when called without a userId (admin panel)", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ childId: "child-1" }));
    storageService.uploadCardImage.mockResolvedValue("/uploads/cards/new.png");
    cardRepository.update.mockResolvedValue(buildCard({ childId: "child-1" }));

    await useCase.execute("card-1", buildFile());

    expect(childAccessService.assertOwnedByUser).not.toHaveBeenCalled();
  });

  it("refuses to upload an image to another user's custom card", async () => {
    cardRepository.findById.mockResolvedValue(buildCard({ childId: "someone-elses-child" }));
    childAccessService.assertOwnedByUser.mockRejectedValue(
      new EntityNotFoundException("Child", "someone-elses-child"),
    );

    await expect(useCase.execute("card-1", buildFile(), "user-1")).rejects.toThrow(EntityNotFoundException);
    expect(storageService.uploadCardImage).not.toHaveBeenCalled();
  });
});
