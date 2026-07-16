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
// (см. TASK_PATCH_STORAGE_DISK.md). Файлы отдаёт сам backend через app.useStaticAssets
// (main.ts), а не отдельный сервис.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>("UPLOAD_DIR", "/app/uploads/cards");
  }

  async uploadCardImage(file: Express.Multer.File | undefined): Promise<string> {
    assertValidCardImage(file);

    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${randomUUID()}${EXTENSION_BY_MIME_TYPE[file.mimetype] ?? ""}`;
    await writeFile(join(this.uploadDir, filename), file.buffer);

    // Относительный путь того же origin, а не абсолютный http://host:port/... — браузер
    // грузит картинку с того же адреса, что и сам сайт, а Next.js проксирует /uploads на
    // backend (next.config.js rewrites), как и /api. Абсолютный URL с PUBLIC_BASE_URL ломался
    // при доступе снаружи (мобильный/туннель cloudflared): хост backend недоступен, и http-
    // ресурс на https-странице блокируется как mixed content.
    return `/uploads/cards/${filename}`;
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
