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
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Регистрация может не пройти на file:// или http без TLS — для демо это не критично,
      // просто не будет офлайн-кэша (онлайн-показ всё равно работает).
    });
  }, []);
  return null;
}
