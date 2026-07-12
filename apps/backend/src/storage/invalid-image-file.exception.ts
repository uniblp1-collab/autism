import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../common/exceptions/domain.exception";

export class InvalidImageFileException extends DomainException {
  constructor(message: string) {
    super(message, "INVALID_IMAGE_FILE", HttpStatus.BAD_REQUEST);
  }
}
