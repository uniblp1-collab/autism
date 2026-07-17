import { CardSize, CardSource, CardType, Gender, SpeechLevel, UserRole } from "./enums";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
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
  // Редакция 3 механики (TASK_REVISE_MECHANICS_AND_ADMIN.md §A.4/A.7).
  difficultyLevel: 1 | 2 | 3;
  unlockedCategoryIds: string[];
  /** Легаси (редакция 3): размер задавался пресетом Мелкие/Средние/Крупные. В редакции 4
   * размер определяется числом карточек на экране (cardsPerPage) и адаптивной сеткой. */
  cardSize: CardSize;
  /** Сколько карточек показывать на одном экране (2–10) — редакция 4. Задаёт и размер плиток
   * (адаптивная сетка делит ширину), и порог клиентской пагинации. */
  cardsPerPage: number;
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
  /** true только у "Дай" — акцентная заливка в строке категорий. */
  isPrimary: boolean;
  /** Служебная категория-контейнер (Да/Нет, прилагательные) — не рендерится пилюлей. */
  isHiddenFromNav: boolean;
  /** Словоформа 1-го лица: "Есть" -> "Ем". */
  phraseForm: string;
  /** Шаблон сборки фразы: плейсхолдеры {verb}/{noun}/{adjective}. */
  sentenceTemplate: string;
  createdAt: string;
}

export interface Card {
  id: string;
  categoryId: string;
  childId: string | null;
  title: string;
  imageUrl: string | null;
  color: string;
  priority: number;
  ttsText: string;
  /** Полная фраза озвучивания, задаётся на карточке целиком ("Пойдём во двор") — редакция 4.
   * Именно это произносится при выборе карточки, без сборки из частей. */
  ttsPhrase: string;
  /** Легаси словоформа для прежней сборки фразы (редакция 3) — для озвучивания больше не источник. */
  phraseForm: string;
  cardType: CardType;
  /** Только для NOUN (собственный род) — используется для согласования прилагательного. */
  gender: Gender | null;
  /** Явные словоформы по родам — заполнены только при cardType === ADJECTIVE. */
  phraseFormMasculine: string | null;
  phraseFormFeminine: string | null;
  phraseFormNeuter: string | null;
  source: CardSource;
  isCustom: boolean;
  /** true только для "Да"/"Нет" — рендерятся отдельной sticky-панелью. */
  isSystemCard: boolean;
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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
