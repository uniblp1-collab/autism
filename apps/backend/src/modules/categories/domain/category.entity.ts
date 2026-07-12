export class Category {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly icon: string,
    public readonly color: string,
    public readonly order: number,
    public readonly isSystem: boolean,
    public readonly isPrimary: boolean,
    public readonly isHiddenFromNav: boolean,
    public readonly phraseForm: string,
    public readonly sentenceTemplate: string,
    public readonly createdAt: Date,
  ) {}
}
