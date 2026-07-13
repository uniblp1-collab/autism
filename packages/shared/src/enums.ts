export enum UserRole {
  PARENT = "PARENT",
  SPECIALIST = "SPECIALIST",
  ADMIN = "ADMIN",
}

export enum SpeechLevel {
  NONE = "NONE",
  SINGLE_WORDS = "SINGLE_WORDS",
  PHRASES = "PHRASES",
  SENTENCES = "SENTENCES",
}

export enum CardSource {
  LIBRARY = "LIBRARY",
  CUSTOM = "CUSTOM",
  AI_GENERATED = "AI_GENERATED",
}

export enum CardType {
  NOUN = "NOUN",
  ADJECTIVE = "ADJECTIVE",
}

export enum Gender {
  MASCULINE = "MASCULINE",
  FEMININE = "FEMININE",
  NEUTER = "NEUTER",
}

// Общий размер карточек в сетке категории на экране ребёнка (не хранится на Card —
// это настройка отображения на уровне ребёнка, не свойство самой карточки).
export enum CardSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}
