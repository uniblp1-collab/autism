"use client";

import { FormEvent, useState } from "react";
import { Button, Icon, Input, useTheme } from "@autism-connect/ui";
import { useUiStore } from "../../../store/uiStore";
import { useCreateSchedule, useSchedules } from "../../../features/schedule/useSchedules";

export default function SchedulePage() {
  const { tokens } = useTheme();
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const { data: schedules = [], isLoading } = useSchedules(selectedChildId);
  const createSchedule = useCreateSchedule();
  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedChildId) return;
    await createSchedule.mutateAsync({ childId: selectedChildId, title, items: [] });
    setTitle("");
  }

  if (!selectedChildId) {
    return <p>Сначала выберите или добавьте ребёнка на странице «Дети».</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <section>
        <h1 className="mb-4" style={{ fontSize: 20, fontWeight: 500 }}>
          Расписание
        </h1>
        {isLoading ? <p>Загрузка...</p> : null}
        <ul className="flex flex-col gap-4">
          {schedules.map((schedule) => (
            <li key={schedule.id} style={{ backgroundColor: tokens.surface, borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: tokens.textPrimary }}>{schedule.title}</p>
              <ol className="mt-2 flex flex-col gap-1">
                {schedule.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2"
                    style={{ fontSize: 14, fontWeight: 400, color: item.isCompleted ? tokens.successText : tokens.textSecondary }}
                  >
                    {item.isCompleted ? <Icon name="check" size={16} strokeWidth={2.5} /> : <span className="inline-block h-4 w-4" />}
                    {item.title}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4" style={{ fontSize: 16, fontWeight: 500 }}>
          Новое расписание
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Название (например, «Утро»)" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit" disabled={createSchedule.isPending}>
            {createSchedule.isPending ? "Сохраняем..." : "Создать"}
          </Button>
        </form>
      </section>
    </div>
  );
}
