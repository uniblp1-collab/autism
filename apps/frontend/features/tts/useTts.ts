export function speakText(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function useTts() {
  return { speak: speakText };
}
