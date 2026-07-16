import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { JsonLoggerService } from "./common/logger/json-logger.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new JsonLoggerService());

  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("FRONTEND_URL", "http://localhost:3000"),
    credentials: true,
  });
  // Картинки карточек — обычные статические файлы с диска (см. StorageService), не S3.
  app.useStaticAssets(config.get<string>("UPLOAD_DIR", "/app/uploads/cards"), {
    prefix: "/uploads/cards/",
  });
  // Без глобального префикса /api: маршруты обслуживаются от корня (/auth, /cards, /health).
  // Префикс /api добавляет только Next.js на этапе rewrites (apps/frontend/next.config.js) —
  // держать префикс в двух слоях означало бы задвоение /api/api/... Прямой доступ к backend
  // для отладки (curl/Postman) теперь тоже идёт от корня: http://localhost:3001/cards.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = config.get<number>("PORT", 4000);
  // 0.0.0.0, а не localhost — иначе backend недоступен из других контейнеров/с хоста (Docker).
  await app.listen(port, "0.0.0.0");
}

bootstrap();
