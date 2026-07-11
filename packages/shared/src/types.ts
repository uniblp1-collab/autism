import { CardSource, SpeechLevel, UserRole } from "./enums";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Child {
  id: string;
  userId: string;
  name: string;
  age: number;
  photoUrl: string | null;
  speechLevel: SpeechLevel;
  favoriteCategoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  color: string;
  order: number;
  isSystem: boolean;
  createdAt: string;
}

export interface Card {
  id: string;
  categoryId: string;
  childId: string | null;
  title: string;
  imageUrl: string;
  color: string;
  priority: number;
  ttsText: string;
  source: CardSource;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  childId: string;
  cardId: string;
  order: number;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  childId: string;
  sentenceText: string;
  cardIds: string[];
  createdAt: string;
}

export interface Schedule {
  id: string;
  childId: string;
  title: string;
  items: ScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  scheduleId: string;
  cardId: string | null;
  title: string;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface DailyStatistic {
  day: string;
  totalCommunications: number;
  entries: { cardId: string; usageCount: number }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  user: User;
  tokens: AuthTokens;
}
