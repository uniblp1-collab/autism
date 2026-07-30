#!/usr/bin/env node
/**
 * Генератор КУРИРОВАННОГО контента офлайн-демо (TASK_DEMO_OFFLINE.md — демо сознательно
 * отходит от «всё из БД»: это урезанный показ, набор карточек задаётся здесь явно).
 *
 * В отличие от export-demo-data.mjs (дословный дамп БД), этот скрипт собирает
 * apps/frontend/public/demo-data/cards.json из явной спецификации ниже: разделы, карточки,
 * фразы озвучивания (ttsPhrase) и расписание — под конкретную демонстрацию заказчику.
 * Картинки берутся из уже лежащих в public/demo-data/images/ (по имени файла); карточки без
 * подходящей картинки рендерятся цветной плиткой с подписью (CardButton это умеет).
 *
 * Запуск:  node apps/frontend/scripts/build-demo-content.mjs
 * БД и сеть НЕ нужны — только текущий cards.json (из него берём записи категорий, служебные
 * карточки Да/Нет и демо-ребёнка) и папка images/.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = path.resolve(__dirname, "..", "public", "demo-data");
const CARDS_JSON = path.join(DEMO_DIR, "cards.json");
const IMAGES_DIR = path.join(DEMO_DIR, "images");

function uuidFrom(seed) {
  const h = crypto.createHash("sha1").update(seed).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "4" + h.slice(13, 16),
    ((parseInt(h.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

// Спецификация демо. Порядок разделов = порядок пилюль; порядок карточек = порядок в массиве
// (priority выставляется убыванием, сортировка на экране — priority desc). img — имя файла в
// images/ (файл demo-<img>.webp), либо null (карточка без картинки — цветная плитка).
//
// Склонения проверены:
//   Дай  → винительный падеж дополнения («Дай игрушку», «Дай книгу»).
//   Болит→ именительный падеж подлежащего («Болит голова») — озвучка «как есть».
//   Идём → предлог направления + винительный («в садик», «в больницу», «на улицу», «домой»,
//          «в бассейн», «на занятия»).
//   Еда/Гигиена → без служебных слов («хочу» и т.п.), проговаривается сам предмет/действие.
const SECTIONS = [
  {
    category: "Дай", // isPrimary — оставляем как есть
    cards: [
      { title: "Планшет", tts: "Дай планшет", img: "planshet" },
      { title: "Пластилин", tts: "Дай пластилин", img: "plastilin" },
      { title: "Карандаши", tts: "Дай карандаши", img: "karandashi" },
      { title: "Игрушка", tts: "Дай игрушку", img: "igrushka" },
      { title: "Книга", tts: "Дай книгу", img: "kniga" },
    ],
  },
  {
    category: "Болит",
    cards: [
      { title: "Голова", tts: "Болит голова", img: "golova" },
      { title: "Зуб", tts: "Болит зуб", img: "zub" },
      { title: "Горло", tts: "Болит горло", img: "gorlo" },
      { title: "Нос", tts: "Болит нос", img: "nos" },
      { title: "Живот", tts: "Болит живот", img: "zhivot" },
      { title: "Ухо", tts: "Болит ухо", img: "ukho" },
      { title: "Нога", tts: "Болит нога", img: "noga" },
      { title: "Рука", tts: "Болит рука", img: "ruka" },
    ],
  },
  {
    category: "Идти",
    cards: [
      { title: "Садик", tts: "Идём в садик", img: "sadik" },
      { title: "Больница", tts: "Идём в больницу", img: "bolnitsa" },
      { title: "Улица", tts: "Идём на улицу", img: "ulitsa" },
      { title: "Магазин", tts: "Идём в магазин", img: "magazin" },
      { title: "Дом", tts: "Идём домой", img: "dom" },
      { title: "Бассейн", tts: "Идём в бассейн", img: "bassein" },
      { title: "Занятия", tts: "Идём на занятия", img: "zanyatiya" },
    ],
  },
  {
    category: "Есть",
    renameTo: "Еда", // явный запрос заказчика
    cards: [
      { title: "Суп", tts: "Суп", img: "sup" },
      { title: "Макароны", tts: "Макароны", img: "makarony" },
      { title: "Картошка", tts: "Картошка", img: "kartoshka" },
      { title: "Гречка", tts: "Гречка", img: "grechka" },
      { title: "Каша", tts: "Каша", img: "kasha" },
      { title: "Курица", tts: "Курица", img: "kuritsa" },
      { title: "Салат", tts: "Салат", img: "salat" },
      { title: "Творог", tts: "Творог", img: "tvorog" },
      { title: "Мороженое", tts: "Мороженое", img: "morozhenoe" },
      { title: "Печенье", tts: "Печенье", img: "pechenye" },
      { title: "Вода", tts: "Вода", img: "voda" },
      { title: "Хлеб", tts: "Хлеб", img: "khleb" },
      { title: "Яблоко", tts: "Яблоко", img: "yabloko" },
    ],
  },
  {
    category: "Гигиена",
    cards: [
      // Озвучка без «хочу» — проговаривается само действие.
      { title: "Чистить зубы", tts: "Чистить зубы", img: "chistit-zuby" },
      { title: "Мыть руки", tts: "Мыть руки", img: "myt-ruki" },
      { title: "Туалет", tts: "Туалет", img: "tualet" },
      { title: "Мыться", tts: "Мыться", img: "mytsya" },
    ],
  },
];

// Расписание: три части дня по три шага (запрос заказчика).
const SCHEDULES = [
  { title: "Утро", items: ["Умыться", "Завтрак", "Садик"] },
  { title: "День", items: ["Обед", "Занятия", "Прогулка"] },
  { title: "Вечер", items: ["Ужин", "Мыться", "Сон"] },
];

async function main() {
  const current = JSON.parse(await readFile(CARDS_JSON, "utf8"));
  const imageFiles = new Set(await readdir(IMAGES_DIR));
  const now = new Date().toISOString();

  const categoryByTitle = new Map(current.categories.map((c) => [c.title, c]));

  function imageUrl(img) {
    if (!img) return null;
    const file = `demo-${img}.webp`;
    if (!imageFiles.has(file)) {
      console.warn(`  [нет картинки] ${file} — карточка останется без изображения`);
      return null;
    }
    return `/demo-data/images/${file}`;
  }

  const cards = [];

  for (const section of SECTIONS) {
    // Идемпотентность: категория могла быть уже переименована прошлым прогоном (Есть→Еда),
    // поэтому ищем и по исходному, и по новому названию.
    const category =
      categoryByTitle.get(section.category) ?? (section.renameTo ? categoryByTitle.get(section.renameTo) : undefined);
    if (!category) throw new Error(`Категория «${section.category}» не найдена в текущем cards.json`);
    if (section.renameTo) category.title = section.renameTo;

    section.cards.forEach((c, index) => {
      cards.push({
        id: uuidFrom(`demo-card-${category.id}-${c.title}`),
        categoryId: category.id,
        childId: null,
        title: c.title,
        imageUrl: imageUrl(c.img),
        color: category.color,
        priority: section.cards.length - index, // сохраняем порядок списка (sort: priority desc)
        ttsText: c.title,
        ttsPhrase: c.tts,
        phraseForm: "",
        cardType: "NOUN",
        gender: null,
        phraseFormMasculine: null,
        phraseFormFeminine: null,
        phraseFormNeuter: null,
        source: "LIBRARY",
        isCustom: false,
        isSystemCard: false,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  // Служебные карточки Да/Нет — берём из текущего дампа как есть (нужны sticky-панели).
  const yesNo = current.cards.filter((c) => c.isSystemCard);
  cards.push(...yesNo);

  // Расписания.
  const schedules = SCHEDULES.map((s, si) => {
    const scheduleId = uuidFrom(`demo-schedule-${s.title}`);
    return {
      id: scheduleId,
      childId: current.demoChildId,
      title: s.title,
      items: s.items.map((title, ii) => ({
        id: uuidFrom(`demo-schedule-item-${s.title}-${title}`),
        scheduleId,
        cardId: null,
        title,
        order: ii,
        isCompleted: false,
        completedAt: null,
      })),
      createdAt: now,
      updatedAt: now,
    };
  });

  const bundle = {
    _demo: true,
    _demoContent: "curated (build-demo-content.mjs)",
    _exportedAt: now,
    demoChildId: current.demoChildId,
    child: { ...current.child, favoriteCategoryIds: current.child.favoriteCategoryIds ?? [] },
    categories: current.categories,
    cards,
    favorites: [], // пусто → вкладка «Избранное» в демо скрывается
    schedules,
  };

  await writeFile(CARDS_JSON, JSON.stringify(bundle, null, 2) + "\n", "utf8");

  const withImg = cards.filter((c) => !c.isSystemCard && c.imageUrl).length;
  const noImg = cards.filter((c) => !c.isSystemCard && !c.imageUrl).length;
  console.log(
    `Готово: разделов ${SECTIONS.length}, карточек ${cards.filter((c) => !c.isSystemCard).length} ` +
      `(с картинкой ${withImg}, без картинки ${noImg}), расписаний ${schedules.length}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
