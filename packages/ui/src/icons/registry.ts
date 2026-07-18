import {
  IconApple,
  IconArrowBarToLeft,
  IconArrowsDiagonal2,
  IconBath,
  IconCalendar,
  IconCar,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCup,
  IconGift,
  IconHome,
  IconMinus,
  IconMoodSmile,
  IconNumber123,
  IconPalette,
  IconPaw,
  IconPencil,
  IconPlus,
  IconPuzzle,
  IconRun,
  IconSchool,
  IconShirt,
  IconStar,
  IconStethoscope,
  IconSun,
  IconTag,
  IconUsers,
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

// Tabler Icons (outline) — DESIGN.md §7. Единственный набор иконок в приложении,
// эмодзи не используются. Ключ — это то, что хранится в Category.icon (см. seed.ts);
// расширять реестр по мере роста библиотеки категорий, не подставлять эмодзи обратно.
export const iconRegistry: Record<string, TablerIcon> = {
  apple: IconApple,
  cup: IconCup,
  puzzle: IconPuzzle,
  users: IconUsers,
  run: IconRun,
  "mood-smile": IconMoodSmile,
  paw: IconPaw,
  shirt: IconShirt,
  car: IconCar,
  bath: IconBath,
  stethoscope: IconStethoscope,
  clock: IconClock,
  sun: IconSun,
  palette: IconPalette,
  "number-123": IconNumber123,
  school: IconSchool,
  gift: IconGift,
  home: IconHome,
  star: IconStar,
  calendar: IconCalendar,
  check: IconCheck,
  tag: IconTag,
  plus: IconPlus,
  minus: IconMinus,
  x: IconX,
  pencil: IconPencil,
  "arrows-diagonal": IconArrowsDiagonal2,
  "chevron-up": IconChevronUp,
  "chevron-down": IconChevronDown,
  "arrow-bar-to-left": IconArrowBarToLeft,
};

export const FALLBACK_ICON_KEY = "tag";

// Подмножество предметных иконок реестра, предлагаемое в UI-пикере иконки раздела
// (самостоятельное изменение кнопки категории родителем) — без служебных/UI-иконок
// (check/x/plus/minus/pencil/arrows-diagonal/chevron-*), которые используются под конкретные
// элементы интерфейса (крестик удаления, плюс "Добавить" и т.п.), а не как иллюстрация раздела.
export const CATEGORY_ICON_PRESETS: string[] = [
  "apple",
  "cup",
  "puzzle",
  "users",
  "run",
  "mood-smile",
  "paw",
  "shirt",
  "car",
  "bath",
  "stethoscope",
  "clock",
  "sun",
  "palette",
  "number-123",
  "school",
  "gift",
  "home",
  "star",
  "calendar",
];

export function resolveIcon(key: string): TablerIcon {
  return iconRegistry[key] ?? iconRegistry[FALLBACK_ICON_KEY];
}
