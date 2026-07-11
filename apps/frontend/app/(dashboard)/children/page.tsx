"use client";

import { FormEvent, useState } from "react";
import { AvatarInitials, Button, Input, useTheme } from "@autism-connect/ui";
import { SpeechLevel } from "@autism-connect/shared";
import { useChildren, useCreateChild } from "../../../features/children/useChildren";

const SPEECH_LEVEL_LABELS: Record<SpeechLevel, string> = {
  [SpeechLevel.NONE]: "Не говорит",
  [SpeechLevel.SINGLE_WORDS]: "Отдельные слова",
  [SpeechLevel.PHRASES]: "Короткие фразы",
  [SpeechLevel.SENTENCES]: "Предложения",
};

export default function ChildrenPage() {
  const { tokens } = useTheme();
  const { data: children = [], isLoading } = useChildren();
  const createChild = useCreateChild();
  const [name, setName] = useState("");
  const [age, setAge] = useState(3);
  const [speechLevel, setSpeechLevel] = useState<SpeechLevel>(SpeechLevel.NONE);

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
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: tokens.textPrimary }}>{child.name}</p>
                <p style={{ fontSize: 13, fontWeight: 400, color: tokens.textSecondary }}>
                  Возраст: {child.age} · {SPEECH_LEVEL_LABELS[child.speechLevel]}
                </p>
              </div>
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
    </div>
  );
}
