export class Category {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly icon: string,
    public readonly order: number,
    public readonly isSystem: boolean,
    public readonly createdAt: Date,
  ) {}
}
