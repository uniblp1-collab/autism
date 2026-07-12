import { assertValidCardImage } from "./card-image-validator";
import { InvalidImageFileException } from "./invalid-image-file.exception";
import { MAX_CARD_IMAGE_SIZE_BYTES } from "./storage.constants";

function buildFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    mimetype: "image/png",
    size: 1024,
    buffer: Buffer.from("fake"),
    ...overrides,
  } as Express.Multer.File;
}

describe("assertValidCardImage", () => {
  it("accepts a jpeg/png/webp file within the size limit", () => {
    expect(() => assertValidCardImage(buildFile({ mimetype: "image/jpeg" }))).not.toThrow();
    expect(() => assertValidCardImage(buildFile({ mimetype: "image/png" }))).not.toThrow();
    expect(() => assertValidCardImage(buildFile({ mimetype: "image/webp" }))).not.toThrow();
  });

  it("throws when no file is provided", () => {
    expect(() => assertValidCardImage(undefined)).toThrow(InvalidImageFileException);
  });

  it("throws for a disallowed mime type", () => {
    expect(() => assertValidCardImage(buildFile({ mimetype: "image/gif" }))).toThrow(InvalidImageFileException);
  });

  it("throws when the file exceeds the 5MB limit", () => {
    expect(() => assertValidCardImage(buildFile({ size: MAX_CARD_IMAGE_SIZE_BYTES + 1 }))).toThrow(
      InvalidImageFileException,
    );
  });
});
