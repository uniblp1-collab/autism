import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    });
  }

  // Проверка/создание бакета — best-effort при старте, а не обязательное условие запуска:
  // если MinIO/S3 временно недоступен, весь бэкенд (включая auth/cards/...) не должен падать
  // из-за одного лишь StorageModule. Ошибка логируется, реальная загрузка файла всё равно
  // провалится своей собственной понятной ошибкой при первом обращении к uploadCardImage.
  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        // TODO(безопасность, MVP-упрощение): бакет создаётся с публичным доступом на чтение,
        // чтобы фронтенд мог загружать картинки карточек напрямую из MinIO без прокси через
        // бэкенд. Для продакшена — приватный бакет + presigned GET URL или CDN перед ним.
        await this.client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Principal: "*",
                  Action: ["s3:GetObject"],
                  Resource: [`arn:aws:s3:::${this.bucket}/*`],
                },
              ],
            }),
          }),
        );
        this.logger.log(`Создан S3-бакет "${this.bucket}" с публичным доступом на чтение`);
      } catch (createError) {
        this.logger.warn(
          `Не удалось проверить/создать S3-бакет "${this.bucket}" при старте — загрузка картинок карточек ` +
            `будет недоступна, пока MinIO/S3 не станет доступен. ${(createError as Error).message}`,
        );
      }
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
