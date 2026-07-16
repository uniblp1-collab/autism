// Адрес backend внутри сети (docker-compose сервис `backend`, порт 3000). Не хардкодить:
// имя `backend` резолвится только внутри одной compose-сети — при другом оркестраторе/имени
// сервиса или при локальном запуске без Docker (backend на localhost:4000) это должно
// настраиваться через .env (BACKEND_INTERNAL_URL), а не правкой кода. Rewrites вычисляются
// на старте сервера (в т.ч. в standalone-режиме), поэтому переменная читается в рантайме.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:3000";

/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
