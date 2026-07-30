#!/usr/bin/env node
/**
 * Подставляет уникальный BUILD_ID в имя кэша service worker (TASK_PWA_CACHE.md §3) и пишет
 * результат в public/sw.js. Раньше версия кэша была строкой, которую разработчик должен был
 * не забыть руками поднять в каждом деплое ("ac-demo-v3") — если забыть, байты sw.js не менялись,
 * браузер не видел новую версию SW и старый кэш отдавался "намертво" (та самая жалоба на
 * необходимость переустановки PWA после правок). Теперь BUILD_ID — таймстамп генерации,
 * гарантированно новый при каждой сборке, независимо от того, что именно изменилось в коде.
 *
 * Заодно дописывает тот же BUILD_ID query-параметром (?v=...) к src иконок в public/manifest.json.
 * Причина: смена файла лого по тому же URL (icons/icon-*.png) не гарантирует, что браузер/ОС
 * перечитают иконку для «Добавить на экран „Домой“» — у iOS Safari есть отдельный системный кэш
 * значка приложения, привязанный именно к URL, а не к содержимому файла, и он не обновляется
 * обычным обновлением страницы/service worker (жалоба «иконка на экране не поменялась» после
 * замены логотипа). ?v=BUILD_ID делает иконку буквально другим URL на каждую сборку — как для
 * этого системного кэша, так и для собственного кэша service worker.
 *
 * Источник — sw-template.js в этой же папке (apps/frontend/); public/sw.js и src иконок в
 * public/manifest.json — сгенерированные значения, править их руками бессмысленно (перезапишутся
 * при следующей сборке). Запускается автоматически перед сборкой демо (см. package.json →
 * build:demo — оттуда же BUILD_ID передаётся как NEXT_PUBLIC_BUILD_ID в next build, чтобы
 * apple-touch-icon в app/layout.tsx использовал тот же самый номер версии), включая сборку в
 * GitHub Actions.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(__dirname, "..", "sw-template.js");
const SW_OUTPUT = path.resolve(__dirname, "..", "public", "sw.js");
const MANIFEST_PATH = path.resolve(__dirname, "..", "public", "manifest.json");

// package.json's build:demo экспортирует BUILD_ID перед вызовом этого скрипта и снова передаёт
// его же в next build (NEXT_PUBLIC_BUILD_ID) — один и тот же номер версии везде за одну сборку.
// При прямом запуске скрипта (без build:demo) считаем свой, чтобы не падать.
const buildId = process.env.BUILD_ID ?? Date.now().toString(36);

const template = await readFile(TEMPLATE, "utf-8");
if (!template.includes("__BUILD_ID__")) {
  throw new Error("generate-sw: __BUILD_ID__ placeholder not found in sw-template.js");
}
const swOutput = template.replaceAll("__BUILD_ID__", buildId);
await writeFile(SW_OUTPUT, swOutput);
console.log(`generate-sw: wrote ${path.relative(process.cwd(), SW_OUTPUT)} (cache communicator-v${buildId})`);

const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
for (const icon of manifest.icons ?? []) {
  // Снимаем версию от прошлой сборки (если есть), прежде чем поставить новую — иначе запросы
  // накапливались бы ("icon-192.png?v=a?v=b?v=c...") при каждой повторной генерации.
  const bareSrc = icon.src.split("?")[0];
  icon.src = `${bareSrc}?v=${buildId}`;
}
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`generate-sw: versioned manifest icons in ${path.relative(process.cwd(), MANIFEST_PATH)} (v=${buildId})`);
