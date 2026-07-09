export class ScheduleItem {
  constructor(
    public readonly id: string,
    public readonly scheduleId: string,
    public readonly cardId: string | null,
    public readonly title: string,
    public readonly order: number,
    public readonly isCompleted: boolean,
    public readonly completedAt: Date | null,
  ) {}
}
