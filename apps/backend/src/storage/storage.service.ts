import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { assertValidCardImage } from "./card-image-validator";
import { InvalidImageFileException } from "./invalid-image-file.exception";

// Карточка никогда не рендерится крупнее пары сотен px даже в адаптивной сетке на планшете
// (TASK_GRID_AND_TTS.md §A) — 640px по длинной стороне с запасом на Retina-плотность, но
// намного меньше исходников с телефона (часто по несколько МБ), которые раньше отдавались
// как есть. Это и есть основная причина долгой загрузки картинок на мобильном/через туннель
// (см. отчёт по задаче) — не сеть виновата, а размер самого файла.
const MAX_IMAGE_DIMENSION_PX = 640;
const WEBP_QUALITY = 82;

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
    // Всегда .webp на выходе независимо от формата загрузки (jpeg/png/webp) — единый формат
    // проще кэшировать/поддерживать, и webp даёт заметно меньший размер файла при том же
    // визуальном качестве, чем jpeg/png (вторая часть фикса "долгой загрузки картинок").
    const filename = `${randomUUID()}.webp`;
    let optimized: Buffer;
    try {
      optimized = await sharp(file.buffer)
        // .rotate() без аргументов — применяет поворот по EXIF-ориентации кадра с телефона
        // ДО ресайза, иначе фото со смартфона в портретной съёмке могло бы лечь на бок.
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION_PX,
          height: MAX_IMAGE_DIMENSION_PX,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch (error) {
      // sharp падает на битых/неполных файлах, которые прошли поверхностную проверку
      // mime-type/размера в assertValidCardImage — это тоже "невалидный файл", а не 500.
      throw new InvalidImageFileException(
        `Не удалось обработать файл изображения: ${(error as Error).message}`,
      );
    }
    await writeFile(join(this.uploadDir, filename), optimized);

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
