"use client";

import { FormEvent, useState } from "react";
import { Button, Icon, Input, useTheme } from "@autism-connect/ui";
import { Schedule } from "@autism-connect/shared";
import { useUiStore } from "../../../store/uiStore";
import { useCards } from "../../../features/cards/useCards";
import { useAddScheduleItem, useCreateSchedule, useSchedules } from "../../../features/schedule/useSchedules";

interface AddStepFormProps {
  schedule: Schedule;
  childId: string;
}

// Позволяет расписать действия/шаги для уже созданного расписания (например, "Ужин") —
// раньше расписание можно было только создать пустым, добавить шаги было негде.
function AddStepForm({ schedule, childId }: AddStepFormProps) {
  const { tokens } = useTheme();
  const addItem = useAddScheduleItem(childId);
  const { data: cards = [] } = useCards({ childId, includeCustom: true });
  const [title, setTitle] = useState("");
  const [cardId, setCardId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await addItem.mutateAsync({
      scheduleId: schedule.id,
      input: { title: title.trim(), cardId: cardId || undefined, order: schedule.items.length },
    });
    setTitle("");
    setCardId("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 flex items-center gap-1"
        style={{ fontSize: 13, fontWeight: 500, color: tokens.accentText }}
      >
        <Icon name="plus" size={16} />
        Добавить шаг
      </button>
    );
  }

  return (
    <form className="mt-2 flex flex-col gap-2" onSubmit={handleSubmit}>
      <Input
        placeholder="Название шага (например, «Помыть руки»)"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        className="px-3 py-2"
        style={{ border: `1px solid ${tokens.border}`, borderRadius: 10, fontSize: 14, backgroundColor: tokens.surface }}
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
      >
        <option value="">Без карточки-иллюстрации</option>
        {cards.map((card) => (
          <option key={card.id} value={card.id}>
            {card.title}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" disabled={addItem.isPending}>
          {addItem.isPending ? "Сохраняем..." : "Добавить"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

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
              <AddStepForm schedule={schedule} childId={selectedChildId} />
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
