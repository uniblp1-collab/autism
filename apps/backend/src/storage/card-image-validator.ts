import { ALLOWED_CARD_IMAGE_MIME_TYPES, MAX_CARD_IMAGE_SIZE_BYTES } from "./storage.constants";
import { InvalidImageFileException } from "./invalid-image-file.exception";

export function assertValidCardImage(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
  if (!file) {
    throw new InvalidImageFileException("Файл изображения не передан");
  }

  if (!(ALLOWED_CARD_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
    throw new InvalidImageFileException("Допустимы только изображения формата JPEG, PNG или WebP");
  }

  if (file.size > MAX_CARD_IMAGE_SIZE_BYTES) {
    throw new InvalidImageFileException("Размер файла превышает 5 МБ");
  }
}
