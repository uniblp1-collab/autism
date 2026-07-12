import { Card, Category } from "@autism-connect/shared";

/**
 * Словоформа прилагательного по роду СУЩЕСТВИТЕЛЬНОГО, с которым оно согласуется
 * (ТЗ §A.4/A.7: явные три словоформы на карточке-прилагательном, не автогенерация
 * по правилам грамматики). Падает обратно на словарную форму, если карточка ещё не
 * заполнена админом полностью.
 */
export function resolveAdjectivePhrase(adjective: Card, nounGender: Card["gender"]): string {
  if (nounGender === "MASCULINE") return adjective.phraseFormMasculine ?? adjective.phraseForm;
  if (nounGender === "FEMININE") return adjective.phraseFormFeminine ?? adjective.phraseForm;
  if (nounGender === "NEUTER") return adjective.phraseFormNeuter ?? adjective.phraseForm;
  return adjective.phraseForm;
}

export interface SentenceParts {
  category: Category;
  noun: Card;
  adjective?: Card | null;
}

/**
 * Собирает итоговый текст фразы по Category.sentenceTemplate (плейсхолдеры
 * {verb}/{noun}/{adjective}). У шаблона глагольной категории нет отдельного слота под
 * прилагательное (только у служебной категории "Признаки") — на уровне сложности 3
 * прилагательное вставляется прямо перед существительным внутри {noun}, это осознанное
 * решение движка, а не финальный грамматический шаблон (см. отчёт по задаче).
 */
export function buildSentenceText({ category, noun, adjective }: SentenceParts): string {
  const adjectivePhrase = adjective ? resolveAdjectivePhrase(adjective, noun.gender) : "";
  const nounPhrase = adjective ? `${adjectivePhrase} ${noun.phraseForm}` : noun.phraseForm;

  return category.sentenceTemplate
    .replace("{verb}", category.phraseForm)
    .replace("{noun}", nounPhrase)
    .replace("{adjective}", adjectivePhrase)
    .replace(/\s+/g, " ")
    .trim();
}
