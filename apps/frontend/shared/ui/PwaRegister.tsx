"use client";

import { useEffect } from "react";

/**
 * Регистрация service worker офлайн-демо (TASK_DEMO_OFFLINE.md §6). Рассчитано на хостинг в
 * корне домена: sw.js регистрируется по абсолютному пути со scope "/", чтобы контролировать
 * все экраны приложения (в т.ч. редирект с корня на экран ребёнка). Рендерится только в демо.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    // Учитываем префикс размещения (GitHub Pages: /autism): sw.js лежит рядом с приложением, а
    // scope должен покрывать все его экраны. Относительные пути внутри самого sw.js резолвятся
    // от этого scope, поэтому больше нигде префикс дублировать не нужно.
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch(() => {
      // Регистрация может не пройти на file:// или http без TLS — для демо это не критично,
      // просто не будет офлайн-кэша (онлайн-показ всё равно работает).
    });
  }, []);
  return null;
}
