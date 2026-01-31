import { Injectable, Logger } from "@nestjs/common";

// ============================================
// RISK MANAGEMENT SERVICE
// ============================================

export interface PositionSizeParams {
  accountBalance: number;
  riskPercentage: number; // e.g., 1-2%
  entryPrice: number;
  stopLossPrice: number;
  leverage?: number;
}

export interface PositionSizeResult {
  positionSize: number; // in units
  positionValue: number; // in USD
  riskAmount: number; // USD at risk
  stopLossDistance: number; // Price distance
  stopLossPercent: number;
  riskRewardRatio?: number;
  maxLeverage: number;
  recommendedLeverage: number;
}

export interface RiskAnalysis {
  portfolioRisk: number; // Total % at risk
  correlationRisk: "LOW" | "MEDIUM" | "HIGH";
  concentrationRisk: "LOW" | "MEDIUM" | "HIGH";
  drawdownRisk: "LOW" | "MEDIUM" | "HIGH";
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendations: string[];
}

export interface Position {
  symbol: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  currentPrice: number;
  size: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  pnlPercent: number;
}

export interface TrailingStopConfig {
  activationPercent: number; // Activate after X% profit
  trailingPercent: number; // Trail by X%
  stepPercent?: number; // Move in steps of X%
}

@Injectable()
export class RiskManagementService {
  private readonly logger = new Logger(RiskManagementService.name);

  /**
   * Calculate optimal position size based on risk parameters
   * Uses the formula: Position Size = (Account * Risk%) / (Entry - StopLoss)
   */
  calculatePositionSize(params: PositionSizeParams): PositionSizeResult {
    const {
      accountBalance,
      riskPercentage,
      entryPrice,
      stopLossPrice,
      leverage = 1,
    } = params;

    // Calculate risk amount in USD
    const riskAmount = accountBalance * (riskPercentage / 100);

    // Calculate stop loss distance
    const isLong = stopLossPrice < entryPrice;
    const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
    const stopLossPercent = (stopLossDistance / entryPrice) * 100;

    // Position size in base currency units
    const positionSize = riskAmount / stopLossDistance;

    // Position value in USD
    const positionValue = positionSize * entryPrice;

    // Max leverage based on account balance
    const maxLeverage = Math.floor(accountBalance / (positionValue / 10)); // Conservative
    const recommendedLeverage = Math.min(
      leverage,
      Math.max(1, Math.floor(maxLeverage / 2)),
    );

    return {
      positionSize: Number(positionSize.toFixed(8)),
      positionValue: Number(positionValue.toFixed(2)),
      riskAmount: Number(riskAmount.toFixed(2)),
      stopLossDistance: Number(stopLossDistance.toFixed(8)),
      stopLossPercent: Number(stopLossPercent.toFixed(2)),
      maxLeverage,
      recommendedLeverage,
    };
  }

  /**
   * Calculate position size with Risk:Reward ratio
   */
  calculatePositionSizeWithRR(
    params: PositionSizeParams,
    takeProfitPrice: number,
  ): PositionSizeResult {
    const result = this.calculatePositionSize(params);

    const tpDistance = Math.abs(takeProfitPrice - params.entryPrice);
    const slDistance = Math.abs(params.stopLossPrice - params.entryPrice);
    const riskRewardRatio = slDistance > 0 ? tpDistance / slDistance : 0;

    return {
      ...result,
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
    };
  }

  /**
   * Kelly Criterion for optimal bet sizing
   * f* = (bp - q) / b
   * where b = odds, p = win probability, q = 1 - p
   */
  calculateKellySize(
    winRate: number, // as decimal, e.g., 0.55
    avgWin: number,
    avgLoss: number,
  ): number {
    const b = avgWin / avgLoss; // Payoff ratio
    const p = winRate;
    const q = 1 - p;

    const kelly = (b * p - q) / b;

    // Use half-Kelly for safety (less aggressive)
    const halfKelly = kelly / 2;

    // Clamp between 0% and 25%
    return Math.max(0, Math.min(0.25, halfKelly));
  }

  /**
   * Analyze portfolio risk
   */
  analyzePortfolioRisk(
    positions: Position[],
    accountBalance: number,
  ): RiskAnalysis {
    const recommendations: string[] = [];

    if (positions.length === 0) {
      return {
        portfolioRisk: 0,
        correlationRisk: "LOW",
        concentrationRisk: "LOW",
        drawdownRisk: "LOW",
        overallRisk: "LOW",
        recommendations: ["No open positions"],
      };
    }

    // Calculate total portfolio risk
    const totalRisk = positions.reduce((sum, pos) => {
      if (pos.stopLoss) {
        const riskPerPosition =
          Math.abs(pos.entryPrice - pos.stopLoss) / pos.entryPrice;
        return sum + riskPerPosition * pos.size * pos.entryPrice;
      }
      // If no stop loss, assume 10% risk
      return sum + pos.size * pos.entryPrice * 0.1;
    }, 0);

    const portfolioRisk = (totalRisk / accountBalance) * 100;

    // Concentration risk (single asset exposure)
    const positionValues = positions.map((p) => p.size * p.currentPrice);
    const maxPosition = Math.max(...positionValues);
    const maxPositionPercent = (maxPosition / accountBalance) * 100;

    let concentrationRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (maxPositionPercent > 30) {
      concentrationRisk = "HIGH";
      recommendations.push(
        `Reduce largest position (${maxPositionPercent.toFixed(1)}% of portfolio)`,
      );
    } else if (maxPositionPercent > 15) {
      concentrationRisk = "MEDIUM";
    }

    // Correlation risk (simplified - count same-side positions)
    const longCount = positions.filter((p) => p.side === "LONG").length;
    const shortCount = positions.filter((p) => p.side === "SHORT").length;
    const sideRatio = Math.max(longCount, shortCount) / positions.length;

    let correlationRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (sideRatio > 0.9 && positions.length > 3) {
      correlationRisk = "HIGH";
      recommendations.push("Consider hedging with opposite-side positions");
    } else if (sideRatio > 0.7 && positions.length > 2) {
      correlationRisk = "MEDIUM";
    }

    // Drawdown risk (positions in loss)
    const losingPositions = positions.filter((p) => p.pnl < 0);
    const totalLoss = losingPositions.reduce(
      (sum, p) => sum + Math.abs(p.pnl),
      0,
    );
    const lossPercent = (totalLoss / accountBalance) * 100;

    let drawdownRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (lossPercent > 10) {
      drawdownRisk = "HIGH";
      recommendations.push(
        "Consider closing losing positions to limit drawdown",
      );
    } else if (lossPercent > 5) {
      drawdownRisk = "MEDIUM";
    }

    // Positions without stop loss
    const noStopLoss = positions.filter((p) => !p.stopLoss).length;
    if (noStopLoss > 0) {
      recommendations.push(`Set stop losses for ${noStopLoss} position(s)`);
    }

    // Overall risk assessment
    let overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    const riskScores = [
      concentrationRisk === "HIGH" ? 3 : concentrationRisk === "MEDIUM" ? 2 : 1,
      correlationRisk === "HIGH" ? 3 : correlationRisk === "MEDIUM" ? 2 : 1,
      drawdownRisk === "HIGH" ? 3 : drawdownRisk === "MEDIUM" ? 2 : 1,
    ];
    const avgRiskScore =
      riskScores.reduce((a, b) => a + b, 0) / riskScores.length;

    if (avgRiskScore >= 2.5 || portfolioRisk > 20) {
      overallRisk = "CRITICAL";
      recommendations.unshift("⚠️ CRITICAL: Reduce overall portfolio exposure");
    } else if (avgRiskScore >= 2 || portfolioRisk > 10) {
      overallRisk = "HIGH";
    } else if (avgRiskScore >= 1.5 || portfolioRisk > 5) {
      overallRisk = "MEDIUM";
    }

    return {
      portfolioRisk: Number(portfolioRisk.toFixed(2)),
      correlationRisk,
      concentrationRisk,
      drawdownRisk,
      overallRisk,
      recommendations,
    };
  }

  /**
   * Calculate trailing stop price
   */
  calculateTrailingStop(
    position: Position,
    config: TrailingStopConfig,
    highestPrice: number, // Highest price since entry for LONG
    lowestPrice: number, // Lowest price since entry for SHORT
  ): { shouldUpdate: boolean; newStopLoss: number } {
    const { activationPercent, trailingPercent, stepPercent = 0 } = config;
    const { side, entryPrice, stopLoss } = position;

    if (side === "LONG") {
      // For LONG: trail below the highest price
      const profitPercent = ((highestPrice - entryPrice) / entryPrice) * 100;

      if (profitPercent < activationPercent) {
        return { shouldUpdate: false, newStopLoss: stopLoss || 0 };
      }

      const trailingStopPrice = highestPrice * (1 - trailingPercent / 100);

      // Check if we should update (step logic)
      if (stopLoss && stepPercent > 0) {
        const minIncrease = entryPrice * (stepPercent / 100);
        if (trailingStopPrice - stopLoss < minIncrease) {
          return { shouldUpdate: false, newStopLoss: stopLoss };
        }
      }

      // Only update if new stop is higher than current
      if (!stopLoss || trailingStopPrice > stopLoss) {
        return {
          shouldUpdate: true,
          newStopLoss: Number(trailingStopPrice.toFixed(8)),
        };
      }
    } else {
      // For SHORT: trail above the lowest price
      const profitPercent = ((entryPrice - lowestPrice) / entryPrice) * 100;

      if (profitPercent < activationPercent) {
        return { shouldUpdate: false, newStopLoss: stopLoss || 0 };
      }

      const trailingStopPrice = lowestPrice * (1 + trailingPercent / 100);

      if (stopLoss && stepPercent > 0) {
        const minDecrease = entryPrice * (stepPercent / 100);
        if (stopLoss - trailingStopPrice < minDecrease) {
          return { shouldUpdate: false, newStopLoss: stopLoss };
        }
      }

      // Only update if new stop is lower than current
      if (!stopLoss || trailingStopPrice < stopLoss) {
        return {
          shouldUpdate: true,
          newStopLoss: Number(trailingStopPrice.toFixed(8)),
        };
      }
    }

    return { shouldUpdate: false, newStopLoss: stopLoss || 0 };
  }

  /**
   * Calculate risk-adjusted returns for comparing strategies
   */
  compareStrategiesRisk(
    strategies: Array<{
      name: string;
      returns: number[];
      maxDrawdown: number;
    }>,
  ): Array<{
    name: string;
    avgReturn: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    riskScore: number;
    recommendation: string;
  }> {
    return strategies.map((strategy) => {
      const avgReturn =
        strategy.returns.reduce((a, b) => a + b, 0) / strategy.returns.length;

      const variance =
        strategy.returns.reduce(
          (sum, r) => sum + Math.pow(r - avgReturn, 2),
          0,
        ) /
        (strategy.returns.length - 1);
      const volatility = Math.sqrt(variance);

      const negativeReturns = strategy.returns.filter((r) => r < 0);
      const downsideVariance =
        negativeReturns.length > 0
          ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) /
            negativeReturns.length
          : 0;
      const downsideDeviation = Math.sqrt(downsideVariance);

      const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;
      const sortinoRatio =
        downsideDeviation > 0 ? avgReturn / downsideDeviation : 0;
      const calmarRatio =
        strategy.maxDrawdown > 0 ? avgReturn / strategy.maxDrawdown : avgReturn;

      // Composite risk score (lower is better)
      const riskScore =
        volatility * 0.3 +
        strategy.maxDrawdown * 0.4 +
        (1 / Math.max(sharpeRatio, 0.01)) * 0.3;

      let recommendation = "";
      if (sharpeRatio > 1.5 && strategy.maxDrawdown < 15) {
        recommendation = "✅ Excellent risk-adjusted returns";
      } else if (sharpeRatio > 1 && strategy.maxDrawdown < 20) {
        recommendation = "👍 Good risk-adjusted returns";
      } else if (sharpeRatio > 0.5) {
        recommendation = "⚠️ Moderate risk - consider position sizing";
      } else {
        recommendation = "❌ High risk - needs optimization";
      }

      return {
        name: strategy.name,
        avgReturn: Number(avgReturn.toFixed(2)),
        volatility: Number(volatility.toFixed(2)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        sortinoRatio: Number(sortinoRatio.toFixed(2)),
        calmarRatio: Number(calmarRatio.toFixed(2)),
        riskScore: Number(riskScore.toFixed(2)),
        recommendation,
      };
    });
  }
}
