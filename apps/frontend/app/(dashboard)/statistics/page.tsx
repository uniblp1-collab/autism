"use client";

import { useUiStore } from "../../../store/uiStore";
import { useStatistics } from "../../../features/statistics/useStatistics";

export default function StatisticsPage() {
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const { data: stats = [], isLoading } = useStatistics(selectedChildId);

  if (!selectedChildId) {
    return <p>Сначала выберите или добавьте ребёнка на странице «Дети».</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold">Статистика за последние 30 дней</h1>
      {isLoading ? <p>Загрузка...</p> : null}
      {stats.length === 0 && !isLoading ? <p>Данных пока нет.</p> : null}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 text-left">
            <th className="py-2">Дата</th>
            <th className="py-2">Всего коммуникаций</th>
            <th className="py-2">Топ карточек</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((day) => (
            <tr key={day.day} className="border-b border-gray-200">
              <td className="py-2">{new Date(day.day).toLocaleDateString("ru-RU")}</td>
              <td className="py-2">{day.totalCommunications}</td>
              <td className="py-2">
                {[...day.entries]
                  .sort((a, b) => b.usageCount - a.usageCount)
                  .slice(0, 3)
                  .map((entry) => `${entry.cardId.slice(0, 8)} (${entry.usageCount})`)
                  .join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
