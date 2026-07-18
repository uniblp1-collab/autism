#!/usr/bin/env node
/**
 * Заполняет картинки библиотечных карточек локальными файлами из
 * packages/database/seed-assets/cards/ (в отличие от fetch-opensymbols-images.mjs, этому
 * скрипту не нужен внешний интернет — только запущенный backend на localhost, поэтому его
 * можно гонять и из песочницы Claude Code).
 *
 * Что делает:
 *  1. Логинится в backend.
 *  2. Забирает все библиотечные карточки (GET /cards).
 *  3. Для каждой карточки БЕЗ imageUrl (если не передан --force) ищет файл в TITLE_TO_FILE
 *     и загружает его через POST /cards/:id/image — backend сам обрежет/пережмёт в WebP
 *     (см. StorageService), скрипту не нужно думать о финальном размере/формате.
 *
 * Использование:
 *   API_EMAIL=demo@autismconnect.dev API_PASSWORD=Password123! \
 *   node packages/database/scripts/seed-card-images.mjs [--dry-run] [--force]
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "seed-assets", "cards");

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";
const EMAIL = process.env.API_EMAIL ?? "demo@autismconnect.dev";
const PASSWORD = process.env.API_PASSWORD ?? "Password123!";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

// Соответствие 1:1 с packages/database/prisma/seed-data.ts — расширять этот список вместе
// с seed-data.ts, если появляются новые библиотечные карточки с готовыми картинками.
const TITLE_TO_FILE = {
  Мяч: "myach.png",
  Сок: "sok.png",
  Игрушка: "igrushka.png",
  Печенье: "pechenye.png",
  Вода: "voda.png",
  Книга: "kniga.png",
  Шар: "shar.png",
  Машина: "mashina.png",
  Живот: "zhivot.png",
  Голова: "golova.png",
  Зуб: "zub.png",
  Горло: "gorlo.png",
  Ухо: "ukho.png",
  Нога: "noga.png",
  Парк: "park.png",
  Магазин: "magazin.png",
  Дом: "dom.png",
  Улица: "ulitsa.png",
  Школа: "shkola.png",
  Двор: "dvor.png",
  Яблоко: "yabloko.png",
  Банан: "banan.png",
  Каша: "kasha.png",
  Суп: "sup.png",
  Йогурт: "yogurt.png",
  Хлеб: "khleb.png",
  Туалет: "tualet.png",
  Мыться: "mytsya.png",
  "Чистить зубы": "chistit-zuby.png",
};

async function login() {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Не удалось войти как ${EMAIL}: HTTP ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.accessToken;
}

async function fetchLibraryCards(token) {
  const res = await fetch(`${API_BASE_URL}/cards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Не удалось получить список карточек: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function uploadCardImage(token, cardId, buffer, filename) {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/png" }), filename);
  const res = await fetch(`${API_BASE_URL}/cards/${cardId}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Загрузка картинки для карточки ${cardId} провалилась: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log(`Логинюсь как ${EMAIL}...`);
  const token = await login();

  console.log("Загружаю список библиотечных карточек...");
  const cards = await fetchLibraryCards(token);
  const targets = cards.filter((c) => (FORCE || !c.imageUrl) && TITLE_TO_FILE[c.title]);

  console.log(`Карточек к обработке: ${targets.length} из ${cards.length}${DRY_RUN ? " (dry-run)" : ""}`);

  for (const card of targets) {
    const filename = TITLE_TO_FILE[card.title];
    const filePath = path.join(ASSETS_DIR, filename);
    try {
      if (DRY_RUN) {
        console.log(`  [dry-run] «${card.title}» -> ${filename}`);
        continue;
      }
      const buffer = await readFile(filePath);
      await uploadCardImage(token, card.id, buffer, filename);
      console.log(`  [ок] «${card.title}» <- ${filename}`);
    } catch (error) {
      console.error(`  [ошибка] «${card.title}»: ${error.message}`);
    }
  }

  console.log("Готово.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
