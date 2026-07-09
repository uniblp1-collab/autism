export class Favorite {
  constructor(
    public readonly id: string,
    public readonly childId: string,
    public readonly cardId: string,
    public readonly order: number,
    public readonly createdAt: Date,
  ) {}
}
