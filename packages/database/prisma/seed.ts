import { PrismaClient, Role, SpeechLevel } from "../generated/client";
import * as bcrypt from "bcryptjs";
import { NO_CARD, seedAdjectives, seedVerbCategories, slugify, YES_CARD } from "./seed-data";

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
        imageUrl: null,
        color: category.color,
        priority: index,
        ttsText: noun.title,
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
      imageUrl: null,
      color: adjective.color,
      priority: index,
      ttsText: adjective.title,
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
      imageUrl: null,
      color: card.color,
      priority: index,
      ttsText: card.ttsText,
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

  const washCard = await prisma.card.findFirst({ where: { title: "Лицо" } });
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
  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
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
