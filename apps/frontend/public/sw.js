/*
 * Service worker офлайн-демо-PWA (TASK_DEMO_OFFLINE.md §6, кэширование переработано по
 * TASK_PWA_CACHE.md). ИСТОЧНИК — этот файл; итоговый public/sw.js генерируется из него
 * scripts/generate-sw.mjs (подставляет уникальный id сборки в имя кэша ниже), см.
 * package.json → build:demo. Не редактировать public/sw.js напрямую — правки в нём теряются
 * при следующей сборке.
 *
 * Написан вручную (а не через next-pwa/Workbox), чтобы не зависеть от совместимости плагина со
 * static export конкретной версии Next.js — допустимый «аналогичный» вариант из ТЗ (раздел 5).
 * Работает и в корне домена, и в подпапке (GitHub Pages) — все пути относительные, резолвятся
 * от scope регистрации (см. DEMO_README.md и PwaRegister.tsx).
 *
 * Стратегии по типам ресурсов (TASK_PWA_CACHE.md §2) — раньше всё было cache-first «намертво»,
 * из-за чего новые сборки не подхватывались без переустановки:
 *  - HTML/навигация и demo-data/cards.json — network-first (свежее при наличии сети, кэш офлайн);
 *  - _next/static/* (имя файла содержит хэш сборки) — cache-first (безопасно, новая сборка сама
 *    получает новые имена, старые файлы просто перестают запрашиваться);
 *  - demo-data/images/* — stale-while-revalidate (мгновенно из кэша, обновление в фоне);
 *  - всё остальное (manifest.json, иконки) — network-first как безопасный дефолт.
 */
const CACHE = "communicator-v1785381459";
const CORE_ASSETS = ["./", "./manifest.json", "./demo-data/cards.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE_ASSETS).catch(() => {});
      // Предзагрузка всех картинок карточек — чтобы офлайн работали и разделы, которые
      // пользователь ещё не открывал.
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
        // Нет сети при установке — не критично: докэшируется при первом онлайн-показе.
      }
      // Намеренно НЕ вызываем self.skipWaiting() здесь (TASK_PWA_CACHE.md §4/§6, вариант А):
      // без него новый service worker переходит в activate только когда закрыты все вкладки,
      // управляемые старым SW — то есть ровно "при следующем полном закрытии/открытии", как и
      // требуется. skipWaiting() дал бы немедленный захват прямо посреди активной сессии ребёнка,
      // а этого допускать нельзя (см. activate ниже — по той же причине там нет clients.claim()).
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Чистим все кэши прежних версий — не копим мусор, не отдаём устаревшее (TASK_PWA_CACHE.md §3).
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      // Без clients.claim(): активация и так происходит только после закрытия всех вкладок со
      // старым SW (см. install выше), поэтому к моменту activate открытых "чужих" клиентов уже
      // нет — claim() здесь ничего не меняет по сути, но его явное отсутствие держит намерение
      // (никогда не перехватывать активную вкладку) видимым и однозначным.
    })(),
  );
});

async function cacheFirst(cache, req) {
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
  return res;
}

async function networkFirst(cache, req, navigationFallback) {
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // Офлайн, переход между экранами, и этот конкретный URL не закэширован: отдаём оболочку
    // приложения (корневой index.html) — дальше клиентский роутер сам покажет нужный экран.
    if (navigationFallback) {
      const shell = await cache.match("./");
      if (shell) return shell;
    }
    throw e;
  }
}

function staleWhileRevalidate(event, cache, req) {
  const refresh = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  // waitUntil — чтобы фоновое обновление кэша не оборвалось сразу после того, как мы уже
  // ответили закэшированной версией ниже (respondWith само по себе не продлевает жизнь SW).
  event.waitUntil(refresh);
  return cache.match(req).then((cached) => cached ?? refresh);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      if (url.pathname.includes("/_next/static/")) {
        return cacheFirst(cache, req);
      }
      if (url.pathname.includes("/demo-data/images/")) {
        return staleWhileRevalidate(event, cache, req);
      }
      // HTML-навигация и cards.json — свежие данные при наличии сети (иначе новые правки не
      // подхватываются без переустановки), офлайн-фолбэк на кэш как и раньше.
      return networkFirst(cache, req, req.mode === "navigate");
    })(),
  );
});
