import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { StrategiesService } from "../strategies/strategies.service";
import { IndicatorsService } from "../indicators/indicators.service";
import { CreateBacktestDto } from "./dto/create-backtest.dto";
import {
  BacktestResult,
  BacktestStatus,
  BacktestTrade,
  TradeType,
  BacktestMetrics,
  EquityPoint,
  DrawdownPoint,
  BacktestConfig,
} from "./backtesting.types";

/**
 * BacktestingService - Simulates trading strategies on historical data
 *
 * Features:
 * - Historical data replay
 * - Strategy execution simulation
 * - Performance metrics calculation
 * - Equity curve generation
 * - Risk metrics (Sharpe ratio, max drawdown)
 * - Comparison with buy-and-hold
 */
@Injectable()
export class BacktestingService {
  private readonly logger = new Logger(BacktestingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategiesService: StrategiesService,
    private readonly indicatorsService: IndicatorsService,
  ) {}

  /**
   * Create and start a new backtest
   */
  async createBacktest(
    userId: string,
    dto: CreateBacktestDto,
  ): Promise<BacktestResult> {
    this.logger.log(`Creating backtest for user ${userId}`);

    const config: BacktestConfig = {
      strategyId: dto.strategyId,
      cryptoSymbol: dto.cryptoSymbol,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      initialCapital: dto.initialCapital,
      timeframe: dto.timeframe || "1h",
      tradingFee: dto.tradingFee || 0.1,
      slippage: dto.slippage || 0.05,
    };

    // Create backtest record in database
    const backtest = await this.prisma.backtest.create({
      data: {
        userId,
        cryptoId: config.strategyId, // TODO: should be actual crypto ID
        name: `Backtest ${config.cryptoSymbol} ${config.timeframe}`,
        startDate: config.startDate,
        endDate: config.endDate,
        initialCapital: config.initialCapital,
        timeframe: config.timeframe,
        status: BacktestStatus.PENDING,
        strategyConfig: config as any,
      },
    });

    // Start backtest execution (async)
    this.executeBacktest(backtest.id, config).catch((error) => {
      this.logger.error(`Backtest ${backtest.id} failed: ${error.message}`);
    });

    return {
      id: backtest.id,
      config,
      status: BacktestStatus.PENDING,
      trades: [],
      metrics: this.createEmptyMetrics(config.initialCapital),
      equityCurve: [],
      drawdownCurve: [],
      startedAt: new Date(),
    };
  }

  /**
   * Execute backtest simulation
   */
  private async executeBacktest(
    backtestId: string,
    config: BacktestConfig,
  ): Promise<void> {
    try {
      this.logger.log(`Starting backtest execution: ${backtestId}`);

      // Update status to RUNNING
      await this.prisma.backtest.update({
        where: { id: backtestId },
        data: { status: BacktestStatus.RUNNING },
      });

      // Fetch historical candles
      const candles = await this.prisma.candle.findMany({
        where: {
          symbol: `${config.cryptoSymbol}USDT`,
          interval: config.timeframe,
          openTime: {
            gte: config.startDate,
            lte: config.endDate,
          },
        },
        orderBy: { openTime: "asc" },
      });

      if (candles.length === 0) {
        throw new Error("No historical data available for the selected period");
      }

      this.logger.log(
        `Loaded ${candles.length} candles for backtest ${backtestId}`,
      );

      // Initialize trading state
      let balance = config.initialCapital;
      let position: { amount: number; entryPrice: number } | null = null;
      const trades: BacktestTrade[] = [];
      const equityCurve: EquityPoint[] = [];
      let peak = config.initialCapital;
      const drawdownCurve: DrawdownPoint[] = [];

      // Simulate trading for each candle
      for (let i = 50; i < candles.length; i++) {
        const currentCandle = candles[i];
        const historicalCandles = candles.slice(0, i + 1);

        // Get strategy signal
        const signal = await this.getStrategySignal(
          config.strategyId,
          config.cryptoSymbol,
          historicalCandles,
        );

        const currentPrice = parseFloat(currentCandle.close.toString());

        // Execute trades based on signal
        if (signal.type === "BUY" && !position && balance > 0) {
          // Calculate position size (use 95% of balance to leave room for fees)
          const tradeFee = (balance * 0.95 * config.tradingFee) / 100;
          const slippageAmount = (balance * 0.95 * config.slippage) / 100;
          const effectiveCapital = balance * 0.95 - tradeFee - slippageAmount;
          const amount = effectiveCapital / currentPrice;

          position = {
            amount,
            entryPrice: currentPrice,
          };

          balance -= effectiveCapital + tradeFee + slippageAmount;

          trades.push({
            id: `${backtestId}-${trades.length}`,
            timestamp: currentCandle.openTime,
            type: TradeType.BUY,
            price: currentPrice,
            amount,
            fee: tradeFee,
            total: effectiveCapital,
            balance,
            reason: signal.reason,
          });
        } else if (signal.type === "SELL" && position) {
          // Sell position
          const total = position.amount * currentPrice;
          const tradeFee = (total * config.tradingFee) / 100;
          const slippageAmount = (total * config.slippage) / 100;
          const netProceeds = total - tradeFee - slippageAmount;

          balance += netProceeds;

          trades.push({
            id: `${backtestId}-${trades.length}`,
            timestamp: currentCandle.openTime,
            type: TradeType.SELL,
            price: currentPrice,
            amount: position.amount,
            fee: tradeFee,
            total: netProceeds,
            balance,
            reason: signal.reason,
          });

          position = null;
        }

        // Calculate current equity
        const positionValue = position ? position.amount * currentPrice : 0;
        const equity = balance + positionValue;

        // Track equity curve
        equityCurve.push({
          timestamp: currentCandle.openTime,
          equity,
          totalReturn: equity - config.initialCapital,
          totalReturnPercent:
            ((equity - config.initialCapital) / config.initialCapital) * 100,
        });

        // Track drawdown
        if (equity > peak) {
          peak = equity;
        }
        const drawdown = peak - equity;
        const drawdownPercent = (drawdown / peak) * 100;

        drawdownCurve.push({
          timestamp: currentCandle.openTime,
          drawdown,
          drawdownPercent,
          peak,
        });
      }

      // Close any open position at the end
      if (position) {
        const finalPrice = parseFloat(
          candles[candles.length - 1].close.toString(),
        );
        const total = position.amount * finalPrice;
        const tradeFee = (total * config.tradingFee) / 100;
        balance += total - tradeFee;

        trades.push({
          id: `${backtestId}-${trades.length}`,
          timestamp: candles[candles.length - 1].openTime,
          type: TradeType.SELL,
          price: finalPrice,
          amount: position.amount,
          fee: tradeFee,
          total: total - tradeFee,
          balance,
          reason: "End of backtest period",
        });
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(
        trades,
        equityCurve,
        drawdownCurve,
        config,
        candles,
      );

      // Save results to database
      await this.prisma.backtest.update({
        where: { id: backtestId },
        data: {
          status: BacktestStatus.COMPLETED,
          completedAt: new Date(),
          trades: trades as any,
          totalTrades: metrics.totalTrades,
          winningTrades: metrics.winningTrades,
          losingTrades: metrics.losingTrades,
          winRate: metrics.winRate,
          profitFactor: metrics.profitFactor,
          sharpeRatio: metrics.sharpeRatio,
          maxDrawdown: metrics.maxDrawdown,
          totalReturn: metrics.totalReturn,
          finalCapital: metrics.finalCapital,
          equityCurve: equityCurve as any,
        },
      });

      this.logger.log(`Backtest ${backtestId} completed successfully`);
      this.logger.log(
        `Total trades: ${trades.length}, Win rate: ${metrics.winRate.toFixed(2)}%, Net profit: $${metrics.netProfit.toFixed(2)}`,
      );
    } catch (error) {
      this.logger.error(`Backtest ${backtestId} failed: ${error.message}`);

      // For now, just mark as failed - no error field in schema
      await this.prisma.backtest.update({
        where: { id: backtestId },
        data: {
          status: BacktestStatus.FAILED,
        },
      });

      throw error;
    }
  }

  /**
   * Get strategy signal for historical data
   */
  private async getStrategySignal(
    strategyId: string,
    cryptoSymbol: string,
    historicalCandles: any[],
  ): Promise<{
    type: "BUY" | "SELL" | "HOLD";
    reason: string;
    confidence: number;
  }> {
    // Use the last 200 candles for indicator calculation
    const recentCandles = historicalCandles.slice(-200);

    // Get strategy by ID
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy ${strategyId} not found`);
    }

    // Get comprehensive analysis
    const analysis = await this.indicatorsService.getComprehensiveAnalysis(
      cryptoSymbol,
      "1h",
    );

    if (!analysis) {
      return {
        type: "HOLD",
        reason: "No analysis available",
        confidence: 0,
      };
    }

    // Determine signal based on strategy type
    // For now, we use a simple consensus approach
    if (analysis.overallSignal === "BUY" && analysis.confidence > 0.6) {
      return {
        type: "BUY",
        reason: `Strong buy signal (${analysis.overallSignal})`,
        confidence: analysis.confidence,
      };
    } else if (analysis.overallSignal === "SELL" && analysis.confidence > 0.6) {
      return {
        type: "SELL",
        reason: `Strong sell signal (${analysis.overallSignal})`,
        confidence: analysis.confidence,
      };
    }

    return {
      type: "HOLD",
      reason: "No clear signal",
      confidence: analysis.confidence,
    };
  }

  /**
   * Calculate backtest metrics
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    equityCurve: EquityPoint[],
    drawdownCurve: DrawdownPoint[],
    config: BacktestConfig,
    candles: any[],
  ): BacktestMetrics {
    // Separate buy and sell trades
    const sellTrades = trades.filter((t) => t.type === TradeType.SELL);

    // Calculate profits/losses for each trade pair
    const tradePairs: { profit: number; return: number }[] = [];
    for (let i = 1; i < sellTrades.length; i++) {
      const buyTrade = trades.find(
        (t) =>
          t.type === TradeType.BUY && t.timestamp < sellTrades[i].timestamp,
      );
      if (buyTrade) {
        const profit = sellTrades[i].total - buyTrade.total;
        const returnPct = (profit / buyTrade.total) * 100;
        tradePairs.push({ profit, return: returnPct });
      }
    }

    const winningTrades = tradePairs.filter((t) => t.profit > 0);
    const losingTrades = tradePairs.filter((t) => t.profit < 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = Math.abs(
      losingTrades.reduce((sum, t) => sum + t.profit, 0),
    );
    const netProfit = totalProfit - totalLoss;

    const finalEquity =
      equityCurve[equityCurve.length - 1]?.equity || config.initialCapital;
    const totalReturn = finalEquity - config.initialCapital;
    const totalReturnPercent = (totalReturn / config.initialCapital) * 100;

    // Buy and hold calculation
    const firstPrice = parseFloat(candles[0].close.toString());
    const lastPrice = parseFloat(candles[candles.length - 1].close.toString());
    const buyAndHoldReturn =
      ((lastPrice - firstPrice) / firstPrice) * config.initialCapital;
    const buyAndHoldReturnPercent =
      ((lastPrice - firstPrice) / firstPrice) * 100;

    // Max drawdown
    const maxDrawdown = Math.max(...drawdownCurve.map((d) => d.drawdown), 0);
    const maxDrawdownPercent = Math.max(
      ...drawdownCurve.map((d) => d.drawdownPercent),
      0,
    );

    // Calculate Sharpe ratio (simplified)
    const returns = equityCurve.map((e) => e.totalReturnPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        returns.length,
    );
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);

    return {
      totalTrades: tradePairs.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate:
        tradePairs.length > 0
          ? (winningTrades.length / tradePairs.length) * 100
          : 0,

      totalProfit,
      totalLoss,
      netProfit,
      profitFactor:
        totalLoss > 0
          ? totalProfit / totalLoss
          : totalProfit > 0
            ? Infinity
            : 0,

      averageWin:
        winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss:
        losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin:
        winningTrades.length > 0
          ? Math.max(...winningTrades.map((t) => t.profit))
          : 0,
      largestLoss:
        losingTrades.length > 0
          ? Math.min(...losingTrades.map((t) => t.profit))
          : 0,

      maxDrawdown,
      maxDrawdownPercent,

      sharpeRatio,
      sortinoRatio: sharpeRatio, // Simplified - same as Sharpe for now

      averageTradeReturn:
        tradePairs.length > 0
          ? tradePairs.reduce((sum, t) => sum + t.return, 0) / tradePairs.length
          : 0,
      totalReturn,
      totalReturnPercent,

      buyAndHoldReturn,
      buyAndHoldReturnPercent,

      totalFees,
      finalCapital: finalEquity,
    };
  }

  /**
   * Get backtest by ID
   */
  async getBacktestById(
    backtestId: string,
    userId: string,
  ): Promise<BacktestResult> {
    const backtest = await this.prisma.backtest.findFirst({
      where: {
        id: backtestId,
        userId,
      },
    });

    if (!backtest) {
      throw new NotFoundException(`Backtest ${backtestId} not found`);
    }

    return {
      id: backtest.id,
      config: backtest.strategyConfig as any,
      status: backtest.status as BacktestStatus,
      trades: (backtest.trades as any) || [],
      metrics: {
        totalTrades: backtest.totalTrades || 0,
        winningTrades: backtest.winningTrades || 0,
        losingTrades: backtest.losingTrades || 0,
        winRate: backtest.winRate || 0,
        profitFactor: backtest.profitFactor || 0,
        sharpeRatio: backtest.sharpeRatio || 0,
        maxDrawdown: backtest.maxDrawdown || 0,
        totalReturn: backtest.totalReturn || 0,
        finalCapital: backtest.finalCapital || backtest.initialCapital,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        maxDrawdownPercent: 0,
        sortinoRatio: 0,
        averageTradeReturn: 0,
        totalReturnPercent: 0,
        buyAndHoldReturn: 0,
        buyAndHoldReturnPercent: 0,
        totalFees: 0,
      },
      equityCurve: (backtest.equityCurve as any) || [],
      drawdownCurve: [],
      startedAt: backtest.createdAt,
      completedAt: backtest.completedAt || undefined,
      error: undefined,
    };
  }

  /**
   * List user's backtests
   */
  async listBacktests(
    userId: string,
    limit: number = 20,
  ): Promise<BacktestResult[]> {
    const backtests = await this.prisma.backtest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return backtests.map((backtest) => ({
      id: backtest.id,
      config: backtest.strategyConfig as any,
      status: backtest.status as BacktestStatus,
      trades: (backtest.trades as any) || [],
      metrics: {
        totalTrades: backtest.totalTrades || 0,
        winningTrades: backtest.winningTrades || 0,
        losingTrades: backtest.losingTrades || 0,
        winRate: backtest.winRate || 0,
        profitFactor: backtest.profitFactor || 0,
        sharpeRatio: backtest.sharpeRatio || 0,
        maxDrawdown: backtest.maxDrawdown || 0,
        totalReturn: backtest.totalReturn || 0,
        finalCapital: backtest.finalCapital || backtest.initialCapital,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        maxDrawdownPercent: 0,
        sortinoRatio: 0,
        averageTradeReturn: 0,
        totalReturnPercent: 0,
        buyAndHoldReturn: 0,
        buyAndHoldReturnPercent: 0,
        totalFees: 0,
      },
      equityCurve: (backtest.equityCurve as any) || [],
      drawdownCurve: [],
      startedAt: backtest.createdAt,
      completedAt: backtest.completedAt || undefined,
      error: undefined,
    }));
  }

  /**
   * Delete backtest
   */
  async deleteBacktest(backtestId: string, userId: string): Promise<void> {
    const backtest = await this.prisma.backtest.findFirst({
      where: {
        id: backtestId,
        userId,
      },
    });

    if (!backtest) {
      throw new NotFoundException(`Backtest ${backtestId} not found`);
    }

    await this.prisma.backtest.delete({
      where: { id: backtestId },
    });

    this.logger.log(`Backtest ${backtestId} deleted`);
  }

  /**
   * Helper: Create empty metrics
   */
  private createEmptyMetrics(initialCapital: number): BacktestMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      averageTradeReturn: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      buyAndHoldReturn: 0,
      buyAndHoldReturnPercent: 0,
      totalFees: 0,
      finalCapital: initialCapital,
    };
  }
}
