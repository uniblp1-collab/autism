export class HistoryEntry {
  constructor(
    public readonly id: string,
    public readonly childId: string,
    public readonly sentenceText: string,
    public readonly cardIds: string[],
    public readonly createdAt: Date,
  ) {}
}
