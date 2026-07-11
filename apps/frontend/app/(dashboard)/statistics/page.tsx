"use client";

import { ActivityBarChart, MetricCard } from "@autism-connect/ui";
import { useUiStore } from "../../../store/uiStore";
import { useStatistics } from "../../../features/statistics/useStatistics";

export default function StatisticsPage() {
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const { data: stats = [], isLoading } = useStatistics(selectedChildId);

  if (!selectedChildId) {
    return <p>Сначала выберите или добавьте ребёнка на странице «Дети».</p>;
  }

  const totalCommunications = stats.reduce((sum, day) => sum + day.totalCommunications, 0);
  const activeDays = stats.filter((day) => day.totalCommunications > 0).length;

  const chartData = stats.slice(-14).map((day) => ({
    label: new Date(day.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    value: day.totalCommunications,
  }));

  const topCards = [...stats]
    .flatMap((day) => day.entries)
    .reduce<Record<string, number>>((acc, entry) => {
      acc[entry.cardId] = (acc[entry.cardId] ?? 0) + entry.usageCount;
      return acc;
    }, {});
  const topCardsList = Object.entries(topCards)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>Статистика за последние 30 дней</h1>

      {isLoading ? <p>Загрузка...</p> : null}
      {stats.length === 0 && !isLoading ? <p>Данных пока нет.</p> : null}

      {stats.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Всего коммуникаций" value={totalCommunications} />
            <MetricCard label="Дней с активностью" value={activeDays} />
          </div>

          <div>
            <h2 className="mb-3" style={{ fontSize: 13.5, fontWeight: 500 }}>
              Активность по дням
            </h2>
            <ActivityBarChart data={chartData} />
          </div>

          {topCardsList.length > 0 ? (
            <div>
              <h2 className="mb-3" style={{ fontSize: 13.5, fontWeight: 500 }}>
                Самые используемые карточки
              </h2>
              <ol className="flex flex-col gap-1">
                {topCardsList.map(([cardId, count]) => (
                  <li key={cardId} style={{ fontSize: 14, fontWeight: 400 }}>
                    {cardId.slice(0, 8)} — {count} раз
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
