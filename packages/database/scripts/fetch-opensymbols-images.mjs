#!/usr/bin/env node
/**
 * Разово заполняет картинки библиотечных карточек символами с opensymbols.org — по запросу
 * заказчика, чтобы карточки не оставались пустыми (без фото, только подпись/иконка).
 *
 * ВАЖНО: этот скрипт нельзя запустить из песочницы Claude Code — сетевая политика окружения
 * блокирует opensymbols.org (агент-прокси отвечает 403 на CONNECT, WebFetch — тоже 403).
 * Запускать нужно из окружения с обычным доступом в интернет (локальная машина разработчика,
 * тот же компьютер, с которого поднимается ./packages/docker/dev-up.sh и туннель cloudflared).
 *
 * Что делает:
 *  1. Логинится в backend (email/пароль родителя или админа из .env/аргументов).
 *  2. Забирает все библиотечные карточки (GET /cards — по умолчанию childId=null,
 *     isSystemCard=false, т.е. ровно то, что нужно; служебные Да/Нет пропускаются — они
 *     рендерятся в sticky-панели без картинки).
 *  3. Для каждой карточки БЕЗ imageUrl ищет символ на opensymbols по английскому запросу
 *     (маппинг RU->EN ниже, т.к. opensymbols индексирует контент на английском) и с
 *     ЕДИНЫМ набором символов (--set, по умолчанию arasaac — самый полный бесплатный набор,
 *     последовательный плоский стиль, соответствует "плоскому дизайну" DESIGN.md §6.3).
 *  4. Скачивает картинку и загружает её через уже существующий POST /cards/:id/image —
 *     backend сам обрежет/пережмёт в WebP ≤640px (см. StorageService), так что скрипту не
 *     нужно самому думать о размере/формате.
 *
 * Использование:
 *   OPENSYMBOLS_ACCESS_TOKEN=xxx \
 *   API_EMAIL=demo@autismconnect.dev API_PASSWORD=Password123! \
 *   node packages/database/scripts/fetch-opensymbols-images.mjs [--set=arasaac] [--dry-run] [--force]
 *
 * Токен opensymbols — бесплатный, получается регистрацией приложения на opensymbols.org
 * (Settings -> API Access). Без него API отвечает 401.
 *
 * Флаги:
 *   --dry-run   ничего не загружает, только печатает, что было бы сделано
 *   --force     перезаписывает картинку даже у карточек, где imageUrl уже задан
 *   --set=NAME  предпочитаемый repo_key символов (по умолчанию "arasaac")
 *
 * API_BASE_URL по умолчанию http://localhost:4000 (прямой адрес backend, не через
 * Next.js-прокси — скрипту прокси ни к чему).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";
const EMAIL = process.env.API_EMAIL ?? "demo@autismconnect.dev";
const PASSWORD = process.env.API_PASSWORD ?? "Password123!";
const ACCESS_TOKEN = process.env.OPENSYMBOLS_ACCESS_TOKEN;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");
const setArg = [...args].find((a) => a.startsWith("--set="));
const SYMBOL_SET = setArg ? setArg.split("=")[1] : "arasaac";

// Карточка ищется на opensymbols по английскому запросу — набор индексирует контент
// на английском, а не по языкам библиотек AAC-приложений. Соответствие 1:1 с
// packages/database/prisma/seed-data.ts — расширять этот список вместе с seed-data.ts,
// если появляются новые библиотечные карточки.
const TITLE_TO_QUERY = {
  Мяч: "ball",
  Сок: "juice",
  Игрушка: "toy",
  Печенье: "cookie",
  Вода: "water",
  Книга: "book",
  Шар: "balloon",
  Машина: "car",
  Живот: "stomach",
  Голова: "head",
  Зуб: "tooth",
  Горло: "throat",
  Ухо: "ear",
  Нога: "leg",
  Парк: "park",
  Магазин: "store",
  Дом: "home",
  Улица: "street",
  Школа: "school",
  Двор: "yard",
  Яблоко: "apple",
  Банан: "banana",
  Каша: "porridge",
  Суп: "soup",
  Йогурт: "yogurt",
  Хлеб: "bread",
  Туалет: "toilet",
  Мыться: "bath",
  "Чистить зубы": "brush teeth",
  Зелёный: "green",
  Большой: "big",
  Красный: "red",
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

// opensymbols API v2 — публичные символы разных наборов (arasaac, mulberry, sclera, tawasol,
// pcs и т.д.), у каждого результата есть repo_key. Токен — обязателен (401 без него).
async function searchSymbol(query) {
  const url = new URL("https://www.opensymbols.org/api/v2/symbols");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", ACCESS_TOKEN);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`opensymbols поиск "${query}" вернул HTTP ${res.status}`);
  }
  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;
  return results.find((r) => r.repo_key === SYMBOL_SET) ?? results[0];
}

async function uploadCardImage(token, cardId, imageBuffer, contentType) {
  const form = new FormData();
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  form.append("file", new Blob([imageBuffer], { type: contentType }), `symbol.${extension}`);
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
  if (!ACCESS_TOKEN) {
    console.error("Нужен OPENSYMBOLS_ACCESS_TOKEN — зарегистрируйте приложение на opensymbols.org (Settings -> API Access).");
    process.exitCode = 1;
    return;
  }

  console.log(`Логинюсь как ${EMAIL}...`);
  const token = await login();

  console.log("Загружаю список библиотечных карточек...");
  const cards = await fetchLibraryCards(token);
  const targets = cards.filter((c) => (FORCE || !c.imageUrl) && TITLE_TO_QUERY[c.title]);

  console.log(`Карточек к обработке: ${targets.length} из ${cards.length} (набор символов: ${SYMBOL_SET}${DRY_RUN ? ", dry-run" : ""})`);

  for (const card of targets) {
    const query = TITLE_TO_QUERY[card.title];
    try {
      const symbol = await searchSymbol(query);
      if (!symbol) {
        console.warn(`  [пропуск] «${card.title}» (${query}) — ничего не найдено на opensymbols`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  [dry-run] «${card.title}» (${query}) -> ${symbol.image_url} [${symbol.repo_key}]`);
        continue;
      }
      const imageRes = await fetch(symbol.image_url);
      if (!imageRes.ok) {
        console.warn(`  [пропуск] «${card.title}» — не удалось скачать ${symbol.image_url} (HTTP ${imageRes.status})`);
        continue;
      }
      const contentType = imageRes.headers.get("content-type") ?? "image/png";
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      await uploadCardImage(token, card.id, buffer, contentType);
      console.log(`  [ок] «${card.title}» (${query}) <- ${symbol.repo_key}`);
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
