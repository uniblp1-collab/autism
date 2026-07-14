import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { assertValidCardImage } from "./card-image-validator";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>("S3_ENDPOINT", "http://localhost:9000");
    this.bucket = this.configService.get<string>("S3_BUCKET", "autism-connect-cards");
    // В docker-compose бэкенд обращается к MinIO по внутреннему хосту (`minio:9000`),
    // но браузер должен получать картинки по хосту, доступному снаружи контейнера —
    // отсюда отдельная переменная вместо переиспользования S3_ENDPOINT напрямую.
    this.publicUrl = this.configService.get<string>("S3_PUBLIC_URL", endpoint);
    this.client = new S3Client({
      endpoint,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get<string>("S3_ACCESS_KEY", "minioadmin"),
        secretAccessKey: this.configService.get<string>("S3_SECRET_KEY", "minioadmin"),
      },
      // AWS SDK v3 с версии ~3.729 по умолчанию добавляет заголовки контрольной суммы
      // (x-amz-checksum-*) на запросы, где это поддерживает модель API (WHEN_SUPPORTED).
      // MinIO не реализует эти заголовки для PutBucketPolicy/PutBucketCors/PutObject и
      // отвечает "A header you provided implies functionality that is not implemented".
      // WHEN_REQUIRED возвращает старое поведение — считать контрольную сумму только там,
      // где это реально обязательно.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  // Проверка/создание бакета — best-effort при старте, а не обязательное условие запуска: если
  // MinIO/S3 временно недоступен, весь бэкенд (включая auth/cards/...) не должен падать из-за
  // одного лишь StorageModule.
  //
  // ВАЖНО: публичный доступ на чтение и CORS для бакета сюда намеренно не входят — ни
  // PutBucketPolicy/PutBucketCors из @aws-sdk/client-s3, ни `mc policy`/`mc cors` не работают
  // против MinIO здесь: PutBucketPolicy/PutBucketCors в модели S3 помечены как
  // requestChecksumRequired, SDK безусловно добавляет заголовок x-amz-sdk-checksum-algorithm, и
  // MinIO отвечает "A header you provided implies functionality that is not implemented"; а
  // `mc cors set` падает с ТОЙ ЖЕ ошибкой, потому что современный MinIO вообще не реализует
  // per-bucket CORS API — CORS настраивается только на уровне всего сервера через переменную
  // окружения MINIO_API_CORS_ALLOW_ORIGIN (см. packages/docker/docker-compose.yml). Публичное
  // чтение бакета настраивается один раз через `mc anonymous set download` в init-контейнере
  // createbuckets (тоже в docker-compose.yml) — это единственный путь, который реально работает.
  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucketExists();
    } catch (error) {
      this.logger.warn(
        `Не удалось проверить/создать S3-бакет "${this.bucket}" при старте — загрузка картинок карточек ` +
          `будет недоступна, пока MinIO/S3 не станет доступен. ${(error as Error).message}`,
      );
    }
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Создан S3-бакет "${this.bucket}"`);
    }
  }

  async uploadCardImage(file: Express.Multer.File | undefined): Promise<string> {
    assertValidCardImage(file);

    const key = `cards/${randomUUID()}${EXTENSION_BY_MIME_TYPE[file.mimetype] ?? ""}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicUrl.replace(/\/$/, "")}/${this.bucket}/${key}`;
  }
}
