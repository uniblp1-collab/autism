#!/usr/bin/env node
/**
 * Подставляет уникальный BUILD_ID в имя кэша service worker (TASK_PWA_CACHE.md §3) и пишет
 * результат в public/sw.js. Раньше версия кэша была строкой, которую разработчик должен был
 * не забыть руками поднять в каждом деплое ("ac-demo-v3") — если забыть, байты sw.js не менялись,
 * браузер не видел новую версию SW и старый кэш отдавался "намертво" (та самая жалоба на
 * необходимость переустановки PWA после правок). Теперь BUILD_ID — таймстамп генерации,
 * гарантированно новый при каждой сборке, независимо от того, что именно изменилось в коде.
 *
 * Источник — sw-template.js в этой же папке (apps/frontend/); public/sw.js — сгенерированный
 * артефакт, его руками не редактировать. Запускается автоматически перед сборкой демо
 * (см. package.json → build:demo), включая сборку в GitHub Actions.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(__dirname, "..", "sw-template.js");
const OUTPUT = path.resolve(__dirname, "..", "public", "sw.js");

const template = await readFile(TEMPLATE, "utf-8");
if (!template.includes("__BUILD_ID__")) {
  throw new Error("generate-sw: __BUILD_ID__ placeholder not found in sw-template.js");
}
const buildId = Date.now().toString(36);
const output = template.replaceAll("__BUILD_ID__", buildId);

await writeFile(OUTPUT, output);
console.log(`generate-sw: wrote ${path.relative(process.cwd(), OUTPUT)} (cache communicator-v${buildId})`);
