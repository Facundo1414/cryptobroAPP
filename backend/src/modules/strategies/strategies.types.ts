// Strategy Types and Interfaces

export interface StrategyConfig {
  name: string;
  description: string;
  timeframes: string[];
  parameters: Record<string, any>;
}

export interface StrategySignal {
  symbol: string;
  strategy: string;
  timeframe: string;
  timestamp: Date;
  type: "BUY" | "SELL";
  price: number;
  confidence: number;
  metadata: Record<string, any>;
  stopLoss?: number;
  takeProfit?: number;
  reasoning: string;
}

export interface StrategyResult {
  signal?: StrategySignal;
  shouldEnter: boolean;
  shouldExit: boolean;
  analysis: string;
}

export interface BacktestResult {
  strategy: string;
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface IStrategy {
  name: string;
  description: string;

  analyze(symbol: string, timeframe: string): Promise<StrategyResult>;

  backtest(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date
  ): Promise<BacktestResult>;
}
