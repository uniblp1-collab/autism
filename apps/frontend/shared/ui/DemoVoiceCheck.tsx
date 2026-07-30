"use client";

import { useEffect, useState } from "react";

/**
 * Проверка русского голоса для офлайн-демо (TASK_DEMO_OFFLINE.md §7). Синтез речи
 * (speechSynthesis) не требует интернета, но зависит от наличия русского голоса на конкретном
 * планшете. Если его нет — показываем заметное, но не пугающее сообщение и НЕ блокируем работу,
 * чтобы на демонстрации отсутствие голоса не выглядело как поломка приложения.
 */
export function DemoVoiceCheck() {
  // null — ещё проверяем; true — русский голос есть; false — нет.
  const [hasRuVoice, setHasRuVoice] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setHasRuVoice(false);
      return;
    }

    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      // Список голосов часто пуст до события voiceschanged — не делаем вывод по пустому списку.
      if (voices.length === 0) return;
      setHasRuVoice(voices.some((v) => v.lang.toLowerCase().startsWith("ru")));
    };

    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    // Подстраховка: некоторые движки не шлют voiceschanged — перепроверяем через таймаут.
    const timer = window.setTimeout(() => {
      setHasRuVoice((prev) => {
        if (prev !== null) return prev;
        const voices = window.speechSynthesis.getVoices();
        return voices.some((v) => v.lang.toLowerCase().startsWith("ru"));
      });
    }, 1500);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", check);
      window.clearTimeout(timer);
    };
  }, []);

  if (dismissed || hasRuVoice === null || hasRuVoice === true) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 px-4 py-2"
      style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontSize: 14 }}
    >
      <span>
        На этом устройстве не найден русский голос — озвучивание карточек может не работать.
        Остальное демо работает как обычно.
      </span>
      <button
        type="button"
        aria-label="Скрыть предупреждение"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded px-2 py-1"
        style={{ backgroundColor: "#FDE68A", color: "#92400E", fontWeight: 500 }}
      >
        Понятно
      </button>
    </div>
  );
}
