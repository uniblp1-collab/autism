import { ReactNode } from "react";
import { DEMO_CHILD_ID, isDemoMode } from "../../../shared/api/demoData";

// В офлайн-демо (output: 'export', см. next.config.js) динамический сегмент [childId] должен
// быть перечислен заранее — ребёнок ровно один (демо-срез из БД). В обычной (серверной) сборке
// возвращаем пусто: пути генерируются по запросу, как и раньше (TASK_DEMO_OFFLINE.md §1).
export function generateStaticParams() {
  return isDemoMode ? [{ childId: DEMO_CHILD_ID }] : [];
}

// Отдельная зона без меню/ссылок на настройки (раздел 4.3 ARCHITECTURE.md).
// Единственные интерактивные элементы внутри — карточки, категории, кнопка
// озвучивания и расписание — реализуются в page.tsx этой route-группы.
export default function ChildLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
