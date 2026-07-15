export type CardSource = "LIBRARY" | "CUSTOM" | "AI_GENERATED";
export type CardType = "NOUN" | "ADJECTIVE";
export type Gender = "MASCULINE" | "FEMININE" | "NEUTER";

export class Card {
  constructor(
    public readonly id: string,
    public readonly categoryId: string,
    public readonly childId: string | null,
    public readonly title: string,
    public readonly imageUrl: string | null,
    public readonly color: string,
    public readonly priority: number,
    public readonly ttsText: string,
    public readonly phraseForm: string,
    public readonly cardType: CardType,
    public readonly gender: Gender | null,
    public readonly phraseFormMasculine: string | null,
    public readonly phraseFormFeminine: string | null,
    public readonly phraseFormNeuter: string | null,
    public readonly source: CardSource,
    public readonly isCustom: boolean,
    public readonly isSystemCard: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Точечный кастомный размер карточки в px (TASK_PATCH_3 §1) — null означает "размер по
    // умолчанию из сетки" (Child.cardSize), задаётся только через resize-жест в edit-режиме.
    public readonly width: number | null = null,
    public readonly height: number | null = null,
  ) {}

  /** Словоформа прилагательного, согласованная с родом существительного. */
  phraseFormForGender(gender: Gender): string | null {
    if (gender === "MASCULINE") return this.phraseFormMasculine;
    if (gender === "FEMININE") return this.phraseFormFeminine;
    return this.phraseFormNeuter;
  }
}
