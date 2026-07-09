"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "@autism-connect/ui";
import { useUiStore } from "../../../store/uiStore";
import { useCreateSchedule, useSchedules } from "../../../features/schedule/useSchedules";

export default function SchedulePage() {
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
        <h1 className="mb-4 text-xl font-bold">Расписание</h1>
        {isLoading ? <p>Загрузка...</p> : null}
        <ul className="flex flex-col gap-4">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="rounded-lg border-2 border-gray-200 p-3">
              <p className="font-semibold">{schedule.title}</p>
              <ol className="mt-2 flex flex-col gap-1">
                {schedule.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <span aria-hidden>{item.isCompleted ? "✅" : "⬜"}</span>
                    {item.title}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Новое расписание</h2>
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
