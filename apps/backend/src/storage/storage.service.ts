import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

  // Проверка/создание бакета — best-effort при старте, а не обязательное условие запуска:
  // если MinIO/S3 временно недоступен, весь бэкенд (включая auth/cards/...) не должен падать
  // из-за одного лишь StorageModule. Каждый шаг ловит свою ошибку отдельно (а не один общий
  // try/catch на все три) — иначе сбой первого шага молча отменял бы остальные, а PutBucketPolicy
  // у MinIO ломается систематически (см. комментарий у ensurePublicReadPolicy), из-за чего
  // CORS-настройка вообще никогда бы не пробовалась.
  //
  // ВАЖНО: PutBucketPolicy/PutBucketCors из @aws-sdk/client-s3 не работают против MinIO начиная с
  // версий SDK, где появились "flexible checksums" — S3-модель помечает эти два вызова как
  // requestChecksumRequired: true, поэтому SDK безусловно добавляет заголовок
  // x-amz-sdk-checksum-algorithm, а MinIO отвечает "A header you provided implies functionality
  // that is not implemented" (в отличие от PutObject, где чек-сумма не обязательна и WHEN_REQUIRED
  // её действительно убирает — поэтому сама загрузка картинок и работает). Обойти это на уровне
  // SDK-миддлвари надёжно нельзя (чек-сумма добавляется в момент send(), а не в момент создания
  // команды — .middlewareStack.remove() на самой команде ничего не снимает). Поэтому публичный
  // доступ на чтение и CORS настраиваются НЕ отсюда, а init-контейнером на базе `minio/mc` в
  // packages/docker/docker-compose.yml (createbuckets), который не подвержен этому багу SDK.
  // Вызовы ниже оставлены как best-effort fallback для локального pnpm dev без docker-compose —
  // если они не сработают (см. предупреждение в логе), сами картинки всё равно загружаются
  // (uploadCardImage), просто останутся недоступны браузеру, пока бакет не станет публичным.
  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();

    try {
      await this.ensurePublicReadPolicy();
    } catch (error) {
      this.logger.warn(
        `Не удалось настроить публичный доступ на чтение для бакета "${this.bucket}" — картинки карточек ` +
          `будут недоступны браузеру, пока политика не применится (см. createbuckets в docker-compose.yml). ${(error as Error).message}`,
      );
    }

    try {
      await this.ensureCorsConfigured();
    } catch (error) {
      this.logger.warn(
        `Не удалось настроить CORS для бакета "${this.bucket}" — определение яркости картинки на ` +
          `карточке (инверсия цвета подписи) будет недоступно, сама картинка при этом отобразится нормально. ${(error as Error).message}`,
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

  // TODO(безопасность, MVP-упрощение): бакет держится с публичным доступом на чтение, чтобы
  // фронтенд мог загружать картинки карточек напрямую из MinIO без прокси через бэкенд.
  // Для продакшена — приватный бакет + presigned GET URL или CDN перед ним.
  private async ensurePublicReadPolicy(): Promise<void> {
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
  }

  // Без CORS-заголовков браузер отображает картинку нормально, но <canvas> с ней считается
  // "заражённым" (tainted) — CardButton не смог бы прочитать пиксели для определения
  // светлая/тёмная картинка (инверсия цвета текста поверх фото), getImageData бросал бы
  // SecurityError. Разрешаем анонимное чтение с любого источника — бакет и так публичный.
  private async ensureCorsConfigured(): Promise<void> {
    await this.client.send(
      new PutBucketCorsCommand({
        Bucket: this.bucket,
        CORSConfiguration: {
          CORSRules: [{ AllowedOrigins: ["*"], AllowedMethods: ["GET"], AllowedHeaders: ["*"], MaxAgeSeconds: 3600 }],
        },
      }),
    );
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
