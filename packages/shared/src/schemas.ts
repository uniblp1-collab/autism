import { z } from "zod";
import { CardSize, CardType, Gender, SpeechLevel } from "./enums";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

const difficultyLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const createChildSchema = z.object({
  name: z.string().min(1).max(60),
  age: z.number().int().min(0).max(18),
  photoUrl: z.string().url().optional().nullable(),
  speechLevel: z.nativeEnum(SpeechLevel),
  favoriteCategoryIds: z.array(z.string().uuid()).optional(),
  difficultyLevel: difficultyLevelSchema.optional(),
  unlockedCategoryIds: z.array(z.string().uuid()).optional(),
  cardSize: z.nativeEnum(CardSize).optional(),
  // Число карточек на экране (2–10) — редакция 4, адаптивная сетка + пагинация.
  cardsPerPage: z.number().int().min(2).max(10).optional(),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema.partial();
export type UpdateChildInput = z.infer<typeof updateChildSchema>;

// Настройки уровня сложности/доступных категорий — экран родителя (§A.7).
export const updateChildSettingsSchema = z.object({
  difficultyLevel: difficultyLevelSchema,
  unlockedCategoryIds: z.array(z.string().uuid()),
});
export type UpdateChildSettingsInput = z.infer<typeof updateChildSettingsSchema>;

export const createCategorySchema = z.object({
  title: z.string().min(1).max(60),
  icon: z.string().min(1).max(30),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  order: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  isHiddenFromNav: z.boolean().optional(),
  phraseForm: z.string().max(60).optional(),
  sentenceTemplate: z.string().max(120).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Частичное обновление категории (редактирование раздела из режима редактирования на экране
// ребёнка — прежде всего "озвучка" phraseForm и название). Структурные флаги (isPrimary,
// isHiddenFromNav, isSystem) намеренно не редактируются этой ручкой.
export const updateCategorySchema = z.object({
  title: z.string().min(1).max(60).optional(),
  icon: z.string().min(1).max(30).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  order: z.number().int().min(0).optional(),
  // Пустая строка допустима: у категорий вроде "Гигиена" глагол-связка отсутствует.
  phraseForm: z.string().max(60).optional(),
  sentenceTemplate: z.string().min(1).max(120).optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createCardSchema = z.object({
  categoryId: z.string().uuid(),
  childId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(60),
  // Изображение загружается отдельно через POST /admin/cards/:id/image — необязательно при создании.
  imageUrl: z.string().min(1).optional().nullable(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  priority: z.number().int().min(0).max(100).optional(),
  // Полная фраза озвучивания (редакция 4) — что реально произносится при выборе карточки.
  ttsPhrase: z.string().min(1).max(200),
  // ttsText — легаси; если не передан, бэкенд подставит ttsPhrase. phraseForm — тоже легаси
  // (прежняя сборка фразы из частей), теперь необязателен.
  ttsText: z.string().min(1).max(200).optional(),
  phraseForm: z.string().max(60).optional(),
  cardType: z.nativeEnum(CardType).optional(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  phraseFormMasculine: z.string().max(60).optional().nullable(),
  phraseFormFeminine: z.string().max(60).optional().nullable(),
  phraseFormNeuter: z.string().max(60).optional().nullable(),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = createCardSchema.partial();
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

export const searchCardsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  childId: z.string().uuid().optional(),
  query: z.string().max(100).optional(),
  includeCustom: z.boolean().optional(),
  cardType: z.nativeEnum(CardType).optional(),
  isSystemCard: z.boolean().optional(),
});
export type SearchCardsInput = z.infer<typeof searchCardsSchema>;

export const createFavoriteSchema = z.object({
  childId: z.string().uuid(),
  cardId: z.string().uuid(),
});
export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;

export const createHistorySchema = z.object({
  childId: z.string().uuid(),
  cardIds: z.array(z.string().uuid()).min(1),
  // Категория-глагол не является карточкой, поэтому текст фразы (глагол + сущ./прил.)
  // не всегда восстановим из одних только ttsText карточек — фронт может передать
  // уже собранный текст явно; иначе бэкенд склеивает ttsText карточек по порядку.
  sentenceText: z.string().max(200).optional(),
});
export type CreateHistoryInput = z.infer<typeof createHistorySchema>;

export const createScheduleSchema = z.object({
  childId: z.string().uuid(),
  title: z.string().min(1).max(60),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        cardId: z.string().uuid().optional().nullable(),
        order: z.number().int().min(0),
      }),
    )
    .default([]),
});
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const addScheduleItemSchema = z.object({
  title: z.string().min(1).max(80),
  cardId: z.string().uuid().optional().nullable(),
  order: z.number().int().min(0),
});
export type AddScheduleItemInput = z.infer<typeof addScheduleItemSchema>;

export const completeScheduleItemSchema = z.object({
  isCompleted: z.boolean(),
});
export type CompleteScheduleItemInput = z.infer<typeof completeScheduleItemSchema>;

export const recordCardUsageSchema = z.object({
  childId: z.string().uuid(),
  cardId: z.string().uuid(),
});
export type RecordCardUsageInput = z.infer<typeof recordCardUsageSchema>;

// --- Admin (Part B) ---

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const adminUsersQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});
export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
