#!/usr/bin/env node
/**
 * Разовый подготовительный шаг для ОФЛАЙН-ДЕМО (TASK_DEMO_OFFLINE.md), НЕ часть рантайма.
 *
 * Выгружает из реальной БД всё, что нужно экрану ребёнка, в статический JSON, который
 * вшивается в демо-сборку фронтенда (NEXT_PUBLIC_DEMO_MODE=true), и копирует картинки
 * карточек с диска backend в public/, чтобы демо работало полностью без backend/Postgres/сети.
 *
 * Что делает:
 *   1. Читает категории, библиотечные карточки (childId=null, включая служебные Да/Нет),
 *      демо-ребёнка, его избранное и расписания с шагами.
 *   2. Копирует файлы картинок карточек из UPLOAD_DIR (тот же диск, куда их кладёт
 *      StorageService, см. TASK_PATCH_STORAGE_DISK.md) в apps/frontend/public/demo-data/images/
 *      и переписывает imageUrl в JSON на относительный путь внутри статики (/demo-data/images/…),
 *      чтобы картинки попали в офлайн-кэш PWA и не тянулись с сервера.
 *   3. Пишет бандл apps/frontend/public/demo-data/cards.json.
 *
 * Запуск (один раз при подготовке демо, backend поднимать НЕ нужно — только Postgres):
 *   DATABASE_URL=postgresql://… node packages/database/scripts/export-demo-data.mjs
 *
 * Результат (cards.json + images/) коммитится в демо-ветку, чтобы она собиралась без БД.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const OUT_DIR = path.join(REPO_ROOT, "apps", "frontend", "public", "demo-data");
const OUT_IMAGES_DIR = path.join(OUT_DIR, "images");
const BACKEND_DIR = path.join(REPO_ROOT, "apps", "backend");

// Тот же дефолт, что и в StorageService (apps/backend/src/storage/storage.service.ts) и в
// seed.ts: если UPLOAD_DIR не задан, backend реально пишет/отдаёт картинки отсюда.
const DEFAULT_UPLOAD_DIR = "/app/uploads/cards";

// Демо-ребёнок из seed (packages/database/prisma/seed.ts).
const DEMO_CHILD_ID = process.env.DEMO_CHILD_ID ?? "00000000-0000-4000-9000-000000000001";

const IMAGE_URL_PREFIX = "/uploads/cards/";
const DEMO_IMAGE_URL_PREFIX = "/demo-data/images/";

function resolveUploadDir() {
  const configured = process.env.UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(BACKEND_DIR, configured);
}

const prisma = new PrismaClient();

async function main() {
  const uploadDir = resolveUploadDir();

  console.log("Читаю категории и карточки из БД...");
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  // Библиотечные карточки (childId = null), включая служебные Да/Нет — демо показывает
  // ровно то, что видит ребёнок, кастомные карточки конкретных детей в демо не нужны.
  const cards = await prisma.card.findMany({
    where: { deletedAt: null, childId: null },
    orderBy: [{ priority: "desc" }, { title: "asc" }],
  });

  const child = await prisma.child.findUnique({ where: { id: DEMO_CHILD_ID } });
  if (!child) throw new Error(`Демо-ребёнок ${DEMO_CHILD_ID} не найден — сначала выполните seed.`);

  const favorites = await prisma.favorite.findMany({ where: { childId: DEMO_CHILD_ID } });
  const schedules = await prisma.schedule.findMany({
    where: { childId: DEMO_CHILD_ID },
    include: { items: { orderBy: { order: "asc" } } },
  });

  console.log("Готовлю каталог статики и копирую картинки...");
  await rm(OUT_IMAGES_DIR, { recursive: true, force: true });
  await mkdir(OUT_IMAGES_DIR, { recursive: true });

  let copied = 0;
  let missing = 0;
  const exportedCards = [];
  for (const card of cards) {
    let imageUrl = card.imageUrl;
    if (imageUrl && imageUrl.startsWith(IMAGE_URL_PREFIX)) {
      const filename = imageUrl.slice(IMAGE_URL_PREFIX.length);
      const source = path.join(uploadDir, filename);
      if (existsSync(source)) {
        await copyFile(source, path.join(OUT_IMAGES_DIR, filename));
        imageUrl = `${DEMO_IMAGE_URL_PREFIX}${filename}`;
        copied += 1;
      } else {
        // Файла нет на диске (например, сид картинок не прогонялся) — не роняем экспорт,
        // просто карточка останется без картинки (в UI откат на иконку/заливку).
        console.warn(`  [нет файла] ${filename} — карточка «${card.title}» останется без картинки`);
        imageUrl = null;
        missing += 1;
      }
    }
    exportedCards.push({ ...card, imageUrl });
  }

  const bundle = {
    // Метка — чтобы было видно, что это демо-срез, а не живой источник (см. раздел 6 ТЗ).
    _demo: true,
    _exportedAt: new Date().toISOString(),
    demoChildId: DEMO_CHILD_ID,
    child,
    categories,
    cards: exportedCards,
    favorites,
    schedules,
  };

  await writeFile(path.join(OUT_DIR, "cards.json"), JSON.stringify(bundle, null, 2) + "\n", "utf8");

  console.log(
    `Готово: категорий ${categories.length}, карточек ${exportedCards.length} (картинок скопировано ${copied}` +
      (missing ? `, без файла ${missing}` : "") +
      `), расписаний ${schedules.length}.`,
  );
  console.log(`  JSON:     apps/frontend/public/demo-data/cards.json`);
  console.log(`  Картинки: apps/frontend/public/demo-data/images/`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
