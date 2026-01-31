/**
 * Backtesting Types and Interfaces
 * Defines all backtesting-related types for the system
 */

export enum BacktestStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum TradeType {
  BUY = "BUY",
  SELL = "SELL",
}

export interface BacktestConfig {
  strategyId: string;
  cryptoSymbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  timeframe: string; // '1h', '4h', '1d'
  tradingFee: number; // Percentage (e.g., 0.1 for 0.1%)
  slippage: number; // Percentage
}

export interface BacktestTrade {
  id: string;
  timestamp: Date;
  type: TradeType;
  price: number;
  amount: number;
  fee: number;
  total: number;
  balance: number;
  reason: string;
}

export interface BacktestMetrics {
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
  largestWin: number;
  largestLoss: number;

  maxDrawdown: number;
  maxDrawdownPercent: number;

  sharpeRatio: number;
  sortinoRatio: number;

  averageTradeReturn: number;
  totalReturn: number;
  totalReturnPercent: number;

  buyAndHoldReturn: number;
  buyAndHoldReturnPercent: number;

  totalFees: number;
  finalCapital: number;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  status: BacktestStatus;
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface EquityPoint {
  timestamp: Date;
  equity: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface DrawdownPoint {
  timestamp: Date;
  drawdown: number;
  drawdownPercent: number;
  peak: number;
}

export interface BacktestProgress {
  backtestId: string;
  progress: number; // 0-100
  currentDate: Date;
  tradesExecuted: number;
  message: string;
}
