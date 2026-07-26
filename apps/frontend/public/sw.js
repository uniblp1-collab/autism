/*
 * Service worker офлайн-демо (TASK_DEMO_OFFLINE.md §6). Кэширует всю статику при первой
 * (онлайн) загрузке, после чего приложение работает без сети. Стратегия — cache-first с
 * дозаписью в кэш при первом сетевом ответе; при установке дополнительно предзагружаются
 * все картинки карточек из demo-data/cards.json, чтобы офлайн работали и не открытые страницы.
 *
 * Написан вручную (а не через next-pwa), чтобы не зависеть от совместимости плагина со
 * static export конкретной версии Next.js — это допустимый «аналогичный» вариант из ТЗ.
 * Рассчитан на хостинг в корне домена (см. DEMO_README.md).
 */
const CACHE = "ac-demo-v1";
const CORE_ASSETS = ["./", "./manifest.json", "./demo-data/cards.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE_ASSETS).catch(() => {});
      // Предзагрузка всех картинок карточек — чтобы офлайн работали и страницы, которые
      // пользователь ещё не открыл (например, вторая страница пагинации).
      try {
        const res = await fetch("./demo-data/cards.json", { cache: "no-cache" });
        const data = await res.json();
        const urls = Array.from(
          new Set(
            (data.cards || [])
              .map((c) => c.imageUrl)
              .filter(Boolean)
              // imageUrl хранится как /demo-data/images/... — приводим к относительному от scope.
              .map((u) => (u.startsWith("/") ? "." + u : u)),
          ),
        );
        await cache.addAll(urls).catch(() => {});
      } catch (e) {
        // Нет сети при установке — не критично: картинки докэшируются при первом показе.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // Кэшируем только успешные ответы того же origin (basic) — чтобы не засорять кэш
        // непрозрачными/ошибочными ответами.
        if (res && res.ok && res.type === "basic") {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        // Офлайн и не в кэше: для переходов между экранами отдаём оболочку приложения
        // (корневой index.html), дальше клиентский роутер сам покажет нужный экран.
        if (req.mode === "navigate") {
          const shell = await cache.match("./");
          if (shell) return shell;
        }
        throw e;
      }
    })(),
  );
});
