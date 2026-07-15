import { ReactNode } from "react";

// Отдельная зона без меню/ссылок на настройки (раздел 4.3 ARCHITECTURE.md).
// Единственные интерактивные элементы внутри — карточки, категории, кнопка
// озвучивания и расписание — реализуются в page.tsx этой route-группы.
export default function ChildLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
