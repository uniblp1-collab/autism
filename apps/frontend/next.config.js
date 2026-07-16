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
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
  // Браузер обращается к API относительным путём /api/... (тот же origin, что и сайт), а
  // Next.js проксирует его на backend внутри сети. Один порт наружу вместо двух, CORS
  // перестаёт быть критичным для веб-версии. Backend не имеет глобального префикса /api
  // (см. apps/backend/src/main.ts) — префикс добавляется только здесь, поэтому destination
  // без /api, иначе было бы задвоение /api/api/...
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
