import { Injectable, Logger } from "@nestjs/common";

// ============================================
// BACKTESTING METRICS
// ============================================

export interface Trade {
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  size: number;
  side: "LONG" | "SHORT";
  pnl: number;
  pnlPercent: number;
}

export interface BacktestMetrics {
  // Basic metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;

  // P&L metrics
  totalPnL: number;
  totalPnLPercent: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;

  // Risk metrics
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgDrawdown: number;

  // Time-based
  avgTradeDuration: number; // in hours
  longestWinStreak: number;
  longestLossStreak: number;

  // Expectancy
  expectancy: number; // Average $ expected per trade
  expectancyPercent: number;
}

export interface MonteCarloResult {
  percentile5: number;
  percentile25: number;
  median: number;
  percentile75: number;
  percentile95: number;
  probabilityOfRuin: number;
  expectedReturn: number;
  simulations: number;
}

export interface WalkForwardResult {
  inSamplePeriod: { start: Date; end: Date };
  outSamplePeriod: { start: Date; end: Date };
  inSampleMetrics: BacktestMetrics;
  outSampleMetrics: BacktestMetrics;
  robustnessRatio: number; // outSample Sharpe / inSample Sharpe
  efficiency: number; // outSample return / inSample return
}

@Injectable()
export class BacktestingMetricsService {
  private readonly logger = new Logger(BacktestingMetricsService.name);

  /**
   * Calculate comprehensive backtest metrics
   */
  calculateMetrics(
    trades: Trade[],
    initialCapital: number,
    riskFreeRate = 0.02, // Annual risk-free rate (2%)
  ): BacktestMetrics {
    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl <= 0);

    // Basic metrics
    const totalTrades = trades.length;
    const winRate = (winningTrades.length / totalTrades) * 100;

    // P&L metrics
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnLPercent = (totalPnL / initialCapital) * 100;

    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) /
          winningTrades.length
        : 0;

    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + t.pnl, 0) /
              losingTrades.length,
          )
        : 0;

    const largestWin =
      winningTrades.length > 0
        ? Math.max(...winningTrades.map((t) => t.pnl))
        : 0;

    const largestLoss =
      losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.pnl)) : 0;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor =
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Drawdown calculation
    const { maxDrawdown, maxDrawdownPercent, avgDrawdown } =
      this.calculateDrawdowns(trades, initialCapital);

    // Risk metrics
    const returns = trades.map((t) => t.pnlPercent);
    const sharpeRatio = this.calculateSharpeRatio(returns, riskFreeRate);
    const sortinoRatio = this.calculateSortinoRatio(returns, riskFreeRate);
    const calmarRatio =
      maxDrawdownPercent > 0 ? totalPnLPercent / maxDrawdownPercent : 0;

    // Time-based metrics
    const tradeDurations = trades.map(
      (t) => (t.exitTime.getTime() - t.entryTime.getTime()) / (1000 * 60 * 60),
    );
    const avgTradeDuration =
      tradeDurations.reduce((a, b) => a + b, 0) / trades.length;

    const { longestWinStreak, longestLossStreak } =
      this.calculateStreaks(trades);

    // Expectancy
    const expectancy =
      (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
    const expectancyPercent = (expectancy / initialCapital) * 100;

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnL,
      totalPnLPercent,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown,
      maxDrawdownPercent,
      avgDrawdown,
      avgTradeDuration,
      longestWinStreak,
      longestLossStreak,
      expectancy,
      expectancyPercent,
    };
  }

  /**
   * Sharpe Ratio: Risk-adjusted return
   * (Mean return - Risk-free rate) / Standard deviation of returns
   */
  calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length < 2) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const dailyRiskFree = riskFreeRate / 252; // Annualized to daily

    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
      (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualize: multiply by sqrt(252) for daily returns
    const annualizedSharpe =
      ((meanReturn - dailyRiskFree) / stdDev) * Math.sqrt(252);
    return Number(annualizedSharpe.toFixed(2));
  }

  /**
   * Sortino Ratio: Like Sharpe but only penalizes downside volatility
   * (Mean return - Risk-free rate) / Downside deviation
   */
  calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length < 2) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const dailyRiskFree = riskFreeRate / 252;

    // Only consider negative returns for downside deviation
    const negativeReturns = returns.filter((r) => r < dailyRiskFree);
    if (negativeReturns.length === 0) return Infinity;

    const downsideVariance =
      negativeReturns.reduce(
        (sum, r) => sum + Math.pow(r - dailyRiskFree, 2),
        0,
      ) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);

    if (downsideDeviation === 0) return Infinity;

    const annualizedSortino =
      ((meanReturn - dailyRiskFree) / downsideDeviation) * Math.sqrt(252);
    return Number(annualizedSortino.toFixed(2));
  }

  /**
   * Calculate max drawdown and average drawdown
   */
  calculateDrawdowns(
    trades: Trade[],
    initialCapital: number,
  ): {
    maxDrawdown: number;
    maxDrawdownPercent: number;
    avgDrawdown: number;
  } {
    let peak = initialCapital;
    let equity = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    const drawdowns: number[] = [];

    for (const trade of trades) {
      equity += trade.pnl;

      if (equity > peak) {
        peak = equity;
      }

      const drawdown = peak - equity;
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }

      if (drawdown > 0) {
        drawdowns.push(drawdownPercent);
      }
    }

    const avgDrawdown =
      drawdowns.length > 0
        ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
        : 0;

    return { maxDrawdown, maxDrawdownPercent, avgDrawdown };
  }

  /**
   * Calculate win/loss streaks
   */
  calculateStreaks(trades: Trade[]): {
    longestWinStreak: number;
    longestLossStreak: number;
  } {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;

    for (const trade of trades) {
      if (trade.pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      }
    }

    return { longestWinStreak, longestLossStreak };
  }

  /**
   * Monte Carlo simulation to estimate probability distribution of outcomes
   */
  runMonteCarloSimulation(
    trades: Trade[],
    initialCapital: number,
    simulations = 10000,
    tradingDays = 252,
  ): MonteCarloResult {
    if (trades.length === 0) {
      return {
        percentile5: 0,
        percentile25: 0,
        median: 0,
        percentile75: 0,
        percentile95: 0,
        probabilityOfRuin: 0,
        expectedReturn: 0,
        simulations,
      };
    }

    const pnlPercents = trades.map((t) => t.pnlPercent);
    const finalEquities: number[] = [];
    let ruinCount = 0;
    const ruinThreshold = initialCapital * 0.2; // 80% loss = ruin

    for (let i = 0; i < simulations; i++) {
      let equity = initialCapital;

      // Simulate a year of trading with random trade selection
      for (let day = 0; day < tradingDays; day++) {
        // Random trade from historical trades
        const randomIdx = Math.floor(Math.random() * pnlPercents.length);
        const pnlPercent = pnlPercents[randomIdx];
        equity *= 1 + pnlPercent / 100;

        if (equity <= ruinThreshold) {
          ruinCount++;
          break;
        }
      }

      finalEquities.push(equity);
    }

    // Sort for percentile calculation
    finalEquities.sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => {
      const idx = Math.floor(arr.length * p);
      return arr[idx];
    };

    return {
      percentile5: getPercentile(finalEquities, 0.05),
      percentile25: getPercentile(finalEquities, 0.25),
      median: getPercentile(finalEquities, 0.5),
      percentile75: getPercentile(finalEquities, 0.75),
      percentile95: getPercentile(finalEquities, 0.95),
      probabilityOfRuin: (ruinCount / simulations) * 100,
      expectedReturn:
        ((finalEquities.reduce((a, b) => a + b, 0) / simulations -
          initialCapital) /
          initialCapital) *
        100,
      simulations,
    };
  }

  /**
   * Walk-forward analysis to test strategy robustness
   * Splits data into in-sample (optimization) and out-sample (validation)
   */
  runWalkForwardAnalysis(
    allTrades: Trade[],
    initialCapital: number,
    inSampleRatio = 0.7, // 70% in-sample, 30% out-sample
  ): WalkForwardResult {
    const sortedTrades = [...allTrades].sort(
      (a, b) => a.entryTime.getTime() - b.entryTime.getTime(),
    );

    const splitIdx = Math.floor(sortedTrades.length * inSampleRatio);
    const inSampleTrades = sortedTrades.slice(0, splitIdx);
    const outSampleTrades = sortedTrades.slice(splitIdx);

    const inSampleMetrics = this.calculateMetrics(
      inSampleTrades,
      initialCapital,
    );
    const outSampleMetrics = this.calculateMetrics(
      outSampleTrades,
      initialCapital,
    );

    const robustnessRatio =
      inSampleMetrics.sharpeRatio > 0
        ? outSampleMetrics.sharpeRatio / inSampleMetrics.sharpeRatio
        : 0;

    const efficiency =
      inSampleMetrics.totalPnLPercent > 0
        ? outSampleMetrics.totalPnLPercent / inSampleMetrics.totalPnLPercent
        : 0;

    return {
      inSamplePeriod: {
        start: inSampleTrades[0]?.entryTime || new Date(),
        end: inSampleTrades[inSampleTrades.length - 1]?.exitTime || new Date(),
      },
      outSamplePeriod: {
        start: outSampleTrades[0]?.entryTime || new Date(),
        end:
          outSampleTrades[outSampleTrades.length - 1]?.exitTime || new Date(),
      },
      inSampleMetrics,
      outSampleMetrics,
      robustnessRatio,
      efficiency,
    };
  }

  private getEmptyMetrics(): BacktestMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      avgDrawdown: 0,
      avgTradeDuration: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      expectancy: 0,
      expectancyPercent: 0,
    };
  }
}
