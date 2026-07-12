export type SpeechLevel = "NONE" | "SINGLE_WORDS" | "PHRASES" | "SENTENCES";
export type DifficultyLevel = 1 | 2 | 3;

export class Child {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly age: number,
    public readonly photoUrl: string | null,
    public readonly speechLevel: SpeechLevel,
    public readonly favoriteCategoryIds: string[],
    public readonly difficultyLevel: DifficultyLevel,
    public readonly unlockedCategoryIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
