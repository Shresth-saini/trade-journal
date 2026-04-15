export interface Trade {
  id?: string;
  userId: string;
  asset: string;
  direction: 'BUY' | 'SELL';
  date: string; // ISO date string YYYY-MM-DD
  pnl: number;
  rr: number;
  session: string;
  rating: string; // 'C-' | 'C' | 'B' | 'A' | 'A+'
  type: string[]; // tags
  mistakes: string[];
  psychologyBefore: string;
  psychologyAfter: string;
  screenshots: string[]; // base64 encoded
  notes: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  totalPnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalPnl: number;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
}
