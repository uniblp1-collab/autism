import { PrismaClient, Role, SpeechLevel } from "../generated/client";
import * as bcrypt from "bcryptjs";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { CARD_IMAGE_FILES, NO_CARD, seedAdjectives, seedVerbCategories, slugify, YES_CARD } from "./seed-data";

const prisma = new PrismaClient();

// Детерминированный UUID из строки, чтобы seed был идемпотентным без доп. таблицы соответствий.
function deterministicUuid(seed: string): string {
  const crypto = require("crypto") as typeof import("crypto");
  const hash = crypto.createHash("sha1").update(seed).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join("-");
}

// Базовые иллюстрации библиотечных карточек (packages/database/seed-assets/cards/, см.
// CARD_IMAGE_FILES) применяются прямо здесь, автоматически при обычном `prisma db seed` —
// без отдельного ручного шага/скрипта и без обращения к работающему backend по HTTP: seed
// выполняется в том же контейнере/окружении, что и backend (см. packages/docker/dev-up.sh —
// `prisma db seed` гоняется на каждом запуске), поэтому имеет прямой доступ к тому же диску
// (UPLOAD_DIR), куда backend кладёт и отдаёт картинки карточек (StorageService).
const SEED_ASSETS_DIR = path.join(__dirname, "..", "seed-assets", "cards");
// Если UPLOAD_DIR не абсолютный (как в apps/backend/.env.example для локальной разработки
// без Docker), считаем его относительно apps/backend — именно там, а не от cwd текущего
// процесса, backend резолвит этот путь в проде (см. StorageService).
const BACKEND_DIR = path.resolve(__dirname, "..", "..", "..", "apps", "backend");
const MAX_IMAGE_DIMENSION_PX = 640;
const WEBP_QUALITY = 82;

// То же самое значение по умолчанию, что и в StorageService (apps/backend/src/storage/storage.service.ts)
// — если UPLOAD_DIR нигде не задан (ни в .env, ни в окружении), backend фактически использует
// именно этот абсолютный путь, а не относительный из .env.example. seed.ts обязан резолвить
// директорию точно так же, иначе картинки уйдут туда, откуда backend их не отдаёт.
const DEFAULT_UPLOAD_DIR = "/app/uploads/cards";

function resolveUploadDir(): string {
  const configured = process.env.UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(BACKEND_DIR, configured);
}

// Пережимаем в WebP теми же параметрами, что и StorageService при загрузке через API —
// картинка карточки никогда не рендерится крупнее пары сотен px даже в адаптивной сетке.
// Имя выходного файла детерминированное (не randomUUID) — иначе повторный `prisma db seed`
// плодил бы новый файл на диске при каждом запуске.
async function resolveSeedCardImageUrl(title: string): Promise<string | null> {
  const sourceFilename = CARD_IMAGE_FILES[title];
  if (!sourceFilename) return null;

  const uploadDir = resolveUploadDir();
  // Имя выходного файла берём из ASCII-имени исходного ассета (banan.png -> seed-banan.webp),
  // а не транслитерируем название карточки — так URL картинки не зависит от корректной обработки
  // не-ASCII символов в пути на стороне статики/прокси/CDN.
  const outputFilename = `seed-${path.parse(sourceFilename).name}.webp`;
  const outputPath = path.join(uploadDir, outputFilename);

  if (!existsSync(outputPath)) {
    const source = await readFile(path.join(SEED_ASSETS_DIR, sourceFilename));
    const optimized = await sharp(source)
      .resize({ width: MAX_IMAGE_DIMENSION_PX, height: MAX_IMAGE_DIMENSION_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await mkdir(uploadDir, { recursive: true });
    await writeFile(outputPath, optimized);
  }

  return `/uploads/cards/${outputFilename}`;
}

async function upsertCategory(params: {
  seedKey: string;
  title: string;
  icon: string;
  color: string;
  order: number;
  isPrimary?: boolean;
  isHiddenFromNav?: boolean;
  phraseForm: string;
  sentenceTemplate: string;
}) {
  const id = deterministicUuid(`category-${params.seedKey}`);
  const data = {
    title: params.title,
    icon: params.icon,
    color: params.color,
    order: params.order,
    isSystem: true,
    isPrimary: params.isPrimary ?? false,
    isHiddenFromNav: params.isHiddenFromNav ?? false,
    phraseForm: params.phraseForm,
    sentenceTemplate: params.sentenceTemplate,
  };
  return prisma.category.upsert({ where: { id }, update: data, create: { id, ...data } });
}

async function seedVerbCategoriesAndNouns() {
  const categoryIds: string[] = [];

  for (const category of seedVerbCategories) {
    const record = await upsertCategory({
      seedKey: category.slug,
      title: category.title,
      icon: category.icon,
      color: category.color,
      order: category.order,
      isPrimary: category.isPrimary,
      phraseForm: category.phraseForm,
      sentenceTemplate: category.sentenceTemplate,
    });
    categoryIds.push(record.id);

    for (const [index, noun] of category.nouns.entries()) {
      const cardId = deterministicUuid(`card-${category.slug}-${slugify(noun.title)}`);
      const data = {
        categoryId: record.id,
        title: noun.title,
        phraseForm: noun.phraseForm,
        gender: noun.gender,
        cardType: "NOUN" as const,
        imageUrl: await resolveSeedCardImageUrl(noun.title),
        color: category.color,
        priority: index,
        // ttsText — короткая подпись (легаси), ttsPhrase — полная фраза озвучивания (редакция 4).
        ttsText: noun.title,
        ttsPhrase: noun.ttsPhrase,
        isSystemCard: false,
      };
      await prisma.card.upsert({ where: { id: cardId }, update: data, create: { id: cardId, ...data } });
    }
  }

  return categoryIds;
}

async function seedAdjectiveCards() {
  const adjectivesCategory = await upsertCategory({
    seedKey: "adjectives",
    title: "Признаки",
    icon: "palette",
    color: "#7C3AED",
    order: 90,
    isHiddenFromNav: true,
    phraseForm: "",
    sentenceTemplate: "{adjective} {noun}",
  });

  for (const [index, adjective] of seedAdjectives.entries()) {
    const cardId = deterministicUuid(`card-adjective-${slugify(adjective.title)}`);
    const data = {
      categoryId: adjectivesCategory.id,
      title: adjective.title,
      phraseForm: adjective.masculine,
      phraseFormMasculine: adjective.masculine,
      phraseFormFeminine: adjective.feminine,
      phraseFormNeuter: adjective.neuter,
      cardType: "ADJECTIVE" as const,
      imageUrl: await resolveSeedCardImageUrl(adjective.title),
      color: adjective.color,
      priority: index,
      ttsText: adjective.title,
      ttsPhrase: adjective.title,
      isSystemCard: false,
    };
    await prisma.card.upsert({ where: { id: cardId }, update: data, create: { id: cardId, ...data } });
  }
}

async function seedYesNoCards() {
  const systemCategory = await upsertCategory({
    seedKey: "system",
    title: "Служебные",
    icon: "tag",
    color: "#5F5E5A",
    order: 99,
    isHiddenFromNav: true,
    phraseForm: "",
    sentenceTemplate: "{verb} {noun}", // не используется UI — Да/Нет озвучиваются напрямую
  });

  for (const [index, card] of [YES_CARD, NO_CARD].entries()) {
    const cardId = deterministicUuid(`card-system-${slugify(card.title)}`);
    const data = {
      categoryId: systemCategory.id,
      title: card.title,
      phraseForm: card.title,
      cardType: "NOUN" as const,
      imageUrl: await resolveSeedCardImageUrl(card.title),
      color: card.color,
      priority: index,
      ttsText: card.ttsText,
      ttsPhrase: card.ttsText,
      isSystemCard: true,
    };
    await prisma.card.upsert({ where: { id: cardId }, update: data, create: { id: cardId, ...data } });
  }
}

async function seedDemoUser(unlockedCategoryIds: string[]) {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@autismconnect.dev" },
    update: {},
    create: {
      email: "demo@autismconnect.dev",
      passwordHash,
      role: Role.PARENT,
    },
  });

  const child = await prisma.child.upsert({
    where: { id: "00000000-0000-4000-9000-000000000001" },
    update: { unlockedCategoryIds },
    create: {
      id: "00000000-0000-4000-9000-000000000001",
      userId: user.id,
      name: "Марк",
      age: 5,
      speechLevel: SpeechLevel.SINGLE_WORDS,
      difficultyLevel: 1,
      unlockedCategoryIds,
    },
  });

  const morningSchedule = await prisma.schedule.upsert({
    where: { id: "00000000-0000-4000-9000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-9000-000000000002",
      childId: child.id,
      title: "Утро",
    },
  });

  // Раздел гигиены теперь содержит действия (см. seed-data.ts) — привязываем шаг "Умыться"
  // к карточке "Мыться" (раньше ссылались на "Лицо", которой больше нет).
  const washCard = await prisma.card.findFirst({ where: { title: "Мыться" } });
  const eatCard = await prisma.card.findFirst({ where: { title: "Каша" } });

  const steps: { title: string; cardId?: string }[] = [
    { title: "Проснуться и встать", cardId: undefined },
    { title: "Умыться", cardId: washCard?.id },
    { title: "Позавтракать", cardId: eatCard?.id },
  ];

  for (const [index, step] of steps.entries()) {
    await prisma.scheduleItem.upsert({
      where: { id: `00000000-0000-4000-9100-00000000000${index}` },
      update: {},
      create: {
        id: `00000000-0000-4000-9100-00000000000${index}`,
        scheduleId: morningSchedule.id,
        title: step.title,
        cardId: step.cardId ?? null,
        order: index,
      },
    });
  }
}

// Тестовые учётные данные по умолчанию — те же, что задокументированы в .env.example.
// Не финальный продакшен-секрет: перед реальным деплоем задать свои ADMIN_EMAIL/ADMIN_PASSWORD
// в .env (переопределяют значения ниже) и сгенерировать новый пароль.
const DEFAULT_ADMIN_EMAIL = "admin@autismconnect.local";
const DEFAULT_ADMIN_PASSWORD = "wTCfm8Afp5OXC8A7";

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      `ADMIN_EMAIL/ADMIN_PASSWORD не заданы в .env — админ-аккаунт создан с тестовыми данными по умолчанию (${email}). Задайте свои значения в .env перед продакшен-деплоем.`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // update тоже должен трогать passwordHash: без этого повторный `prisma db seed` после смены
  // ADMIN_PASSWORD в .env молча оставляет старый пароль на уже существующей строке пользователя —
  // админ меняет .env, перезапускает стек, ожидает новый пароль, но логинится всё ещё старым.
  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, passwordHash },
    create: { email, passwordHash, role: Role.ADMIN },
  });
}

async function main() {
  console.log("Seeding verb categories and noun cards...");
  const categoryIds = await seedVerbCategoriesAndNouns();
  console.log("Seeding adjective cards...");
  await seedAdjectiveCards();
  console.log("Seeding Да/Нет system cards...");
  await seedYesNoCards();
  console.log("Seeding demo user, child and morning schedule...");
  await seedDemoUser(categoryIds);
  console.log("Seeding admin account (if ADMIN_EMAIL/ADMIN_PASSWORD set)...");
  await seedAdminUser();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
