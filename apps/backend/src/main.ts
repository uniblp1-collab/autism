import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { JsonLoggerService } from "./common/logger/json-logger.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new JsonLoggerService());

  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("FRONTEND_URL", "http://localhost:3000"),
    credentials: true,
  });
  // /health остаётся вне префикса — liveness-проверка для dev-up.sh/оркестратора.
  app.setGlobalPrefix("api", { exclude: ["health"] });
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
