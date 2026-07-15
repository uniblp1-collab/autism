import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { assertValidCardImage } from "./card-image-validator";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Библиотека карточек и масштаб проекта (один инстанс backend, без горизонтального
// масштабирования) не оправдывают S3-совместимое хранилище — обычный диск сервера с
// постоянным volume (см. packages/docker/docker-compose.yml) проще и надёжнее для этого MVP
// (см. TASK_PATCH_STORAGE_DISK.md). Публичный URL отдаёт сам backend через
// app.useStaticAssets (main.ts), а не отдельный сервис.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>("UPLOAD_DIR", "/app/uploads/cards");
    this.publicBaseUrl = this.configService
      .get<string>("PUBLIC_BASE_URL", "http://localhost:3001")
      .replace(/\/$/, "");
  }

  async uploadCardImage(file: Express.Multer.File | undefined): Promise<string> {
    assertValidCardImage(file);

    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${randomUUID()}${EXTENSION_BY_MIME_TYPE[file.mimetype] ?? ""}`;
    await writeFile(join(this.uploadDir, filename), file.buffer);

    return `${this.publicBaseUrl}/uploads/cards/${filename}`;
  }

  // Вызывается при замене картинки карточки и при удалении самой карточки — иначе файлы без
  // ссылок на них постепенно копятся на диске. Отсутствие файла (например, imageUrl
  // проставлен вручную) — не ошибка выполнения, просто нечего удалять.
  async deleteCardImage(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) return;

    const marker = "/uploads/cards/";
    const index = imageUrl.indexOf(marker);
    if (index === -1) return;

    const filename = imageUrl.slice(index + marker.length);
    if (!filename) return;

    await unlink(join(this.uploadDir, filename)).catch((error) => {
      this.logger.warn(`Не удалось удалить файл картинки "${filename}" с диска: ${(error as Error).message}`);
    });
  }
}
