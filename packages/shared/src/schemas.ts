import { z } from "zod";
import { SpeechLevel } from "./enums";

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

export const createChildSchema = z.object({
  name: z.string().min(1).max(60),
  age: z.number().int().min(0).max(18),
  photoUrl: z.string().url().optional().nullable(),
  speechLevel: z.nativeEnum(SpeechLevel),
  favoriteCategoryIds: z.array(z.string().uuid()).optional(),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema.partial();
export type UpdateChildInput = z.infer<typeof updateChildSchema>;

export const createCategorySchema = z.object({
  title: z.string().min(1).max(60),
  icon: z.string().min(1).max(10),
  order: z.number().int().min(0).default(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const createCardSchema = z.object({
  categoryId: z.string().uuid(),
  childId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(60),
  imageUrl: z.string().min(1),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  priority: z.number().int().min(0).max(100).optional(),
  ttsText: z.string().min(1).max(200),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = createCardSchema.partial();
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

export const searchCardsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  childId: z.string().uuid().optional(),
  query: z.string().max(100).optional(),
  includeCustom: z.boolean().optional(),
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
