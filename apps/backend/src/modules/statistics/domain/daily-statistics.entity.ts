export interface StatisticCardEntry {
  cardId: string;
  usageCount: number;
}

export class DailyStatistics {
  constructor(
    public readonly day: Date,
    public readonly totalCommunications: number,
    public readonly entries: StatisticCardEntry[],
  ) {}
}
