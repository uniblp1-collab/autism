import { CardSource, PrismaClient, Role, SpeechLevel } from "../generated/client";
import * as bcrypt from "bcryptjs";
import { seedCategories, slugify } from "./seed-data";

const prisma = new PrismaClient();

async function seedCategoriesAndCards() {
  for (const category of seedCategories) {
    const record = await prisma.category.upsert({
      where: { id: `00000000-0000-4000-8000-${category.order.toString().padStart(12, "0")}` },
      update: { title: category.title, icon: category.icon, order: category.order },
      create: {
        id: `00000000-0000-4000-8000-${category.order.toString().padStart(12, "0")}`,
        title: category.title,
        icon: category.icon,
        order: category.order,
        isSystem: true,
      },
    });

    for (const [index, word] of category.words.entries()) {
      const cardId = deterministicUuid(`${category.slug}-${slugify(word)}`);
      await prisma.card.upsert({
        where: { id: cardId },
        update: {},
        create: {
          id: cardId,
          categoryId: record.id,
          title: word,
          imageUrl: `/cards/${category.slug}/${slugify(word)}.svg`,
          color: category.color,
          priority: index,
          ttsText: word,
          source: CardSource.LIBRARY,
          isCustom: false,
        },
      });
    }
  }
}

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

async function seedDemoUser() {
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
    update: {},
    create: {
      id: "00000000-0000-4000-9000-000000000001",
      userId: user.id,
      name: "Марк",
      age: 5,
      speechLevel: SpeechLevel.SINGLE_WORDS,
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

  const wakeUpCard = await prisma.card.findFirst({ where: { title: "Одеваться" } });
  const eatCard = await prisma.card.findFirst({ where: { title: "Каша" } });
  const brushCard = await prisma.card.findFirst({ where: { title: "Зубная щётка" } });

  const steps: { title: string; cardId?: string }[] = [
    { title: "Проснуться и встать", cardId: undefined },
    { title: "Одеться", cardId: wakeUpCard?.id },
    { title: "Позавтракать", cardId: eatCard?.id },
    { title: "Почистить зубы", cardId: brushCard?.id },
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

async function main() {
  console.log("Seeding categories and card library (300+)...");
  await seedCategoriesAndCards();
  console.log("Seeding demo user, child and morning schedule...");
  await seedDemoUser();
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
