export type CardSource = "LIBRARY" | "CUSTOM" | "AI_GENERATED";

export class Card {
  constructor(
    public readonly id: string,
    public readonly categoryId: string,
    public readonly childId: string | null,
    public readonly title: string,
    public readonly imageUrl: string,
    public readonly color: string,
    public readonly priority: number,
    public readonly ttsText: string,
    public readonly source: CardSource,
    public readonly isCustom: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
