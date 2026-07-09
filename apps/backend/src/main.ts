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

  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
}

bootstrap();
