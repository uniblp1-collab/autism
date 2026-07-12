"use client";

import { FormEvent, useState } from "react";
import { AvatarInitials, Button, Input, Modal, useTheme } from "@autism-connect/ui";
import { Child, SpeechLevel } from "@autism-connect/shared";
import { useCategories } from "../../../features/cards/useCards";
import { useChildren, useCreateChild, useUpdateChildSettings } from "../../../features/children/useChildren";

const SPEECH_LEVEL_LABELS: Record<SpeechLevel, string> = {
  [SpeechLevel.NONE]: "Не говорит",
  [SpeechLevel.SINGLE_WORDS]: "Отдельные слова",
  [SpeechLevel.PHRASES]: "Короткие фразы",
  [SpeechLevel.SENTENCES]: "Предложения",
};

const DIFFICULTY_LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  1: "1 — мгновенное озвучивание по тапу",
  2: "2 — видимая строка сборки фразы",
  3: "3 — строка сборки + выбор признака (прилагательного)",
};

interface ChildSettingsModalProps {
  child: Child;
  onClose: () => void;
}

// Настройки уровня сложности и доступных категорий-глаголов (ТЗ §A.7) — экран родителя.
// "Дай" всегда доступна и не показывается в списке переключателей (сама себя не выключить).
function ChildSettingsModal({ child, onClose }: ChildSettingsModalProps) {
  const { tokens } = useTheme();
  const { data: categories = [] } = useCategories();
  const toggleableCategories = categories.filter((c) => !c.isPrimary);
  const updateSettings = useUpdateChildSettings(child.id);

  const [difficultyLevel, setDifficultyLevel] = useState<1 | 2 | 3>(child.difficultyLevel);
  const [unlockedCategoryIds, setUnlockedCategoryIds] = useState<string[]>(child.unlockedCategoryIds);

  function toggleCategory(categoryId: string) {
    setUnlockedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await updateSettings.mutateAsync({ difficultyLevel, unlockedCategoryIds });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Настройки: ${child.name}`}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <fieldset className="flex flex-col gap-2">
          <legend style={{ fontSize: 14, fontWeight: 500, color: tokens.textPrimary, marginBottom: 4 }}>
            Уровень сложности
          </legend>
          {([1, 2, 3] as const).map((level) => (
            <label key={level} className="flex items-center gap-2" style={{ fontSize: 14, color: tokens.textSecondary }}>
              <input
                type="radio"
                name="difficultyLevel"
                checked={difficultyLevel === level}
                onChange={() => setDifficultyLevel(level)}
              />
              {DIFFICULTY_LEVEL_LABELS[level]}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend style={{ fontSize: 14, fontWeight: 500, color: tokens.textPrimary, marginBottom: 4 }}>
            Доступные категории
          </legend>
          <label className="flex items-center gap-2" style={{ fontSize: 14, color: tokens.textMuted }}>
            <input type="checkbox" checked disabled />
            Дай (всегда доступна)
          </label>
          {toggleableCategories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2"
              style={{ fontSize: 14, color: tokens.textSecondary }}
            >
              <input
                type="checkbox"
                checked={unlockedCategoryIds.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              {category.title}
            </label>
          ))}
        </fieldset>

        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Сохраняем..." : "Сохранить"}
        </Button>
      </form>
    </Modal>
  );
}

export default function ChildrenPage() {
  const { tokens } = useTheme();
  const { data: children = [], isLoading } = useChildren();
  const createChild = useCreateChild();
  const [name, setName] = useState("");
  const [age, setAge] = useState(3);
  const [speechLevel, setSpeechLevel] = useState<SpeechLevel>(SpeechLevel.NONE);
  const [settingsChildId, setSettingsChildId] = useState<string | null>(null);
  const settingsChild = children.find((c) => c.id === settingsChildId) ?? null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await createChild.mutateAsync({ name, age, speechLevel });
    setName("");
    setAge(3);
    setSpeechLevel(SpeechLevel.NONE);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <section>
        <h1 className="mb-4" style={{ fontSize: 20, fontWeight: 500 }}>
          Дети
        </h1>
        {isLoading ? <p>Загрузка...</p> : null}
        <ul className="flex flex-col gap-2">
          {children.map((child) => (
            <li
              key={child.id}
              className="flex items-center gap-3"
              style={{ backgroundColor: tokens.surface, borderRadius: 14, padding: 16 }}
            >
              <AvatarInitials name={child.name} />
              <div className="flex-1">
                <p style={{ fontSize: 15, fontWeight: 500, color: tokens.textPrimary }}>{child.name}</p>
                <p style={{ fontSize: 13, fontWeight: 400, color: tokens.textSecondary }}>
                  Возраст: {child.age} · {SPEECH_LEVEL_LABELS[child.speechLevel]} · Сложность: {child.difficultyLevel}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setSettingsChildId(child.id)}>
                Настройки
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4" style={{ fontSize: 16, fontWeight: 500 }}>
          Добавить ребёнка
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Имя" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Возраст"
            type="number"
            min={0}
            max={18}
            required
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
          <label className="flex flex-col gap-1" style={{ fontSize: 14, fontWeight: 500, color: tokens.textPrimary }}>
            Уровень речи
            <select
              className="px-3 py-2"
              style={{ border: `1px solid ${tokens.border}`, borderRadius: 10, backgroundColor: tokens.surface }}
              value={speechLevel}
              onChange={(e) => setSpeechLevel(e.target.value as SpeechLevel)}
            >
              {Object.entries(SPEECH_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={createChild.isPending}>
            {createChild.isPending ? "Сохраняем..." : "Добавить"}
          </Button>
        </form>
      </section>

      {settingsChild ? <ChildSettingsModal child={settingsChild} onClose={() => setSettingsChildId(null)} /> : null}
    </div>
  );
}
