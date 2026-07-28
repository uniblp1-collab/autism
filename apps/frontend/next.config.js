// Адрес backend внутри сети (docker-compose сервис `backend`, порт 3000). Не хардкодить:
// имя `backend` резолвится только внутри одной compose-сети — при другом оркестраторе/имени
// сервиса или при локальном запуске без Docker (backend на localhost:4000) это должно
// настраиваться через .env (BACKEND_INTERNAL_URL), а не правкой кода. Rewrites вычисляются
// на старте сервера (в т.ч. в standalone-режиме), поэтому переменная читается в рантайме.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:3000";

// Офлайн-демо (TASK_DEMO_OFFLINE.md): собирается статический экспорт без серверной части и без
// обращения к backend. Та же кодовая база, отдельный режим по флагу — не форк.
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Префикс пути для размещения не в корне домена (напр. GitHub Pages: /autism). Пусто — хостинг
// в корне (Cloudflare Pages). imageUrl карточек и регистрация SW учитывают этот префикс отдельно
// (см. shared/api/demoData.ts и shared/ui/PwaRegister.tsx). Без завершающего слэша.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const demoConfig = {
  reactStrictMode: true,
  // Чистый статический экспорт: HTML/CSS/JS без Node-сервера — раздаётся любым статик-хостингом.
  output: "export",
  // Статический экспорт не умеет оптимизацию картинок на лету (нет сервера) — отдаём как есть.
  images: { unoptimized: true },
  // Каждый маршрут — отдельная папка с index.html: надёжнее отдаётся статик-хостингами и из
  // офлайн-кэша PWA (в т.ч. вложенный /kid/<id>/).
  trailingSlash: true,
  transpilePackages: ["@autism-connect/ui", "@autism-connect/shared"],
  // basePath проставляет префикс на роуты и ассеты Next (_next/...); нужен для размещения в
  // подпапке (GitHub Pages). При пустом BASE_PATH поле не задаём — обычный корневой хостинг.
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  // rewrites на backend в демо не нужны (и несовместимы с output: 'export') — данные берутся из
  // статичного JSON, картинки лежат в /demo-data/images/ той же статики.
};

/** @type {import('next').NextConfig} */
const serverConfig = {
  reactStrictMode: true,
  // Нужен для многоэтапного Dockerfile — копируется только .next/standalone + .next/static + public.
  output: "standalone",
  transpilePackages: ["@autism-connect/ui", "@autism-connect/shared"],
  // remotePatterns под абсолютный http://localhost больше не нужен: картинки карточек теперь
  // отдаются относительным путём /uploads/... того же origin (см. rewrites ниже и
  // StorageService), а next/image считает такие пути локальными без доп. настройки.
  // Браузер обращается к API (/api/...) и картинкам (/uploads/...) относительным путём того же
  // origin, что и сайт, а Next.js проксирует их на backend внутри сети. Один порт наружу вместо
  // двух, CORS не критичен для веб-версии, и всё работает снаружи (мобильный/туннель cloudflared)
  // без абсолютных адресов backend. Backend без глобального префикса /api (см. main.ts) — префикс
  // /api добавляется только здесь (destination без /api, иначе задвоение /api/api/...); /uploads
  // на backend отдаётся как есть (app.useStaticAssets), поэтому destination сохраняет /uploads.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_INTERNAL_URL}/uploads/:path*`,
      },
    ];
  },
};

module.exports = IS_DEMO ? demoConfig : serverConfig;
