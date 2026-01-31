// Example Strategy Implementation
// This file shows how the RSI + Volume strategy would be implemented
// Location: backend/src/modules/strategies/implementations/rsi-volume.strategy.ts

import { Injectable } from "@nestjs/common";
import { RSI } from "technicalindicators";

export interface StrategySignal {
  type: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0-100
  price: number;
  indicators: Record<string, any>;
  suggestedSL?: number;
  suggestedTP?: number;
  reason: string;
}

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class RSIVolumeStrategy {
  private readonly name = "RSI + Volume Confirmation";
  private readonly description =
    "Buy on RSI oversold + high volume, Sell on RSI overbought + high volume";

  // Strategy parameters (can be configurable per user)
  private readonly config = {
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    volumeMultiplier: 1.5,
    volumePeriod: 20,
  };

  /**
   * Evaluate strategy on recent candle data
   */
  async evaluate(
    candles: Candle[],
    cryptoSymbol: string
  ): Promise<StrategySignal | null> {
    // Need at least RSI period + volume period candles
    const requiredCandles =
      Math.max(this.config.rsiPeriod, this.config.volumePeriod) + 10;

    if (candles.length < requiredCandles) {
      console.log(
        `Not enough candles for ${cryptoSymbol}. Need ${requiredCandles}, got ${candles.length}`
      );
      return null;
    }

    // Calculate indicators
    const rsi = this.calculateRSI(candles);
    const currentVolume = candles[candles.length - 1].volume;
    const avgVolume = this.calculateAverageVolume(candles);
    const volumeRatio = currentVolume / avgVolume;

    const currentCandle = candles[candles.length - 1];
    const currentPrice = currentCandle.close;
    const isBullishCandle = currentCandle.close > currentCandle.open;
    const isBearishCandle = currentCandle.close < currentCandle.open;

    // BUY SIGNAL LOGIC
    if (
      rsi < this.config.rsiOversold &&
      volumeRatio >= this.config.volumeMultiplier &&
      isBullishCandle
    ) {
      const confidence = this.calculateBuyConfidence(rsi, volumeRatio, candles);
      const stopLoss = this.calculateStopLoss(candles, "BUY");
      const takeProfit = this.calculateTakeProfit(
        currentPrice,
        stopLoss,
        "BUY"
      );

      return {
        type: "BUY",
        confidence,
        price: currentPrice,
        indicators: {
          rsi: Math.round(rsi * 100) / 100,
          volume: currentVolume,
          avgVolume,
          volumeRatio: Math.round(volumeRatio * 100) / 100,
        },
        suggestedSL: stopLoss,
        suggestedTP: takeProfit,
        reason: `RSI oversold (${rsi.toFixed(2)}) + Volume spike (${volumeRatio.toFixed(2)}x) + Bullish candle`,
      };
    }

    // SELL SIGNAL LOGIC
    if (
      rsi > this.config.rsiOverbought &&
      volumeRatio >= this.config.volumeMultiplier &&
      isBearishCandle
    ) {
      const confidence = this.calculateSellConfidence(
        rsi,
        volumeRatio,
        candles
      );
      const stopLoss = this.calculateStopLoss(candles, "SELL");
      const takeProfit = this.calculateTakeProfit(
        currentPrice,
        stopLoss,
        "SELL"
      );

      return {
        type: "SELL",
        confidence,
        price: currentPrice,
        indicators: {
          rsi: Math.round(rsi * 100) / 100,
          volume: currentVolume,
          avgVolume,
          volumeRatio: Math.round(volumeRatio * 100) / 100,
        },
        suggestedSL: stopLoss,
        suggestedTP: takeProfit,
        reason: `RSI overbought (${rsi.toFixed(2)}) + Volume spike (${volumeRatio.toFixed(2)}x) + Bearish candle`,
      };
    }

    // No signal
    return null;
  }

  /**
   * Calculate RSI indicator
   */
  private calculateRSI(candles: Candle[]): number {
    const closePrices = candles.map((c) => c.close);

    const rsiValues = RSI.calculate({
      values: closePrices,
      period: this.config.rsiPeriod,
    });

    // Return the latest RSI value
    return rsiValues[rsiValues.length - 1];
  }

  /**
   * Calculate average volume over period
   */
  private calculateAverageVolume(candles: Candle[]): number {
    const recentCandles = candles.slice(-this.config.volumePeriod);
    const totalVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0);
    return totalVolume / recentCandles.length;
  }

  /**
   * Calculate buy confidence score (0-100)
   */
  private calculateBuyConfidence(
    rsi: number,
    volumeRatio: number,
    candles: Candle[]
  ): number {
    let confidence = 50; // Base confidence

    // RSI component (lower RSI = higher confidence)
    // RSI 30 → +0, RSI 20 → +10, RSI 10 → +20
    const rsiBonus = Math.max(0, (30 - rsi) / 2);
    confidence += rsiBonus;

    // Volume component (higher ratio = higher confidence)
    // 1.5x → +0, 2x → +10, 3x+ → +20
    const volumeBonus = Math.min(20, (volumeRatio - 1.5) * 20);
    confidence += volumeBonus;

    // Trend component (check if bouncing from support)
    const isNearSupport = this.isNearSupport(candles);
    if (isNearSupport) {
      confidence += 10;
    }

    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  /**
   * Calculate sell confidence score (0-100)
   */
  private calculateSellConfidence(
    rsi: number,
    volumeRatio: number,
    candles: Candle[]
  ): number {
    let confidence = 50;

    // RSI component (higher RSI = higher confidence)
    // RSI 70 → +0, RSI 80 → +10, RSI 90 → +20
    const rsiBonus = Math.max(0, (rsi - 70) / 2);
    confidence += rsiBonus;

    // Volume component
    const volumeBonus = Math.min(20, (volumeRatio - 1.5) * 20);
    confidence += volumeBonus;

    // Trend component (check if hitting resistance)
    const isNearResistance = this.isNearResistance(candles);
    if (isNearResistance) {
      confidence += 10;
    }

    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  /**
   * Calculate stop loss level
   */
  private calculateStopLoss(candles: Candle[], type: "BUY" | "SELL"): number {
    const recentCandles = candles.slice(-20);
    const currentPrice = candles[candles.length - 1].close;

    if (type === "BUY") {
      // Stop loss below recent low
      const recentLow = Math.min(...recentCandles.map((c) => c.low));
      return recentLow * 0.98; // 2% below recent low
    } else {
      // Stop loss above recent high
      const recentHigh = Math.max(...recentCandles.map((c) => c.high));
      return recentHigh * 1.02; // 2% above recent high
    }
  }

  /**
   * Calculate take profit level (Risk/Reward = 1:2)
   */
  private calculateTakeProfit(
    entryPrice: number,
    stopLoss: number,
    type: "BUY" | "SELL"
  ): number {
    const riskRewardRatio = 2; // 1:2 risk/reward

    if (type === "BUY") {
      const risk = entryPrice - stopLoss;
      return entryPrice + risk * riskRewardRatio;
    } else {
      const risk = stopLoss - entryPrice;
      return entryPrice - risk * riskRewardRatio;
    }
  }

  /**
   * Check if price is near support level
   */
  private isNearSupport(candles: Candle[]): boolean {
    const recentCandles = candles.slice(-50);
    const currentPrice = candles[candles.length - 1].close;

    // Find recent lows
    const lows = recentCandles.map((c) => c.low);
    const sortedLows = [...lows].sort((a, b) => a - b);
    const support = sortedLows[Math.floor(sortedLows.length * 0.1)]; // 10th percentile

    // Check if current price is within 2% of support
    const distanceToSupport = Math.abs(currentPrice - support) / support;
    return distanceToSupport < 0.02; // Within 2%
  }

  /**
   * Check if price is near resistance level
   */
  private isNearResistance(candles: Candle[]): boolean {
    const recentCandles = candles.slice(-50);
    const currentPrice = candles[candles.length - 1].close;

    // Find recent highs
    const highs = recentCandles.map((c) => c.high);
    const sortedHighs = [...highs].sort((a, b) => b - a);
    const resistance = sortedHighs[Math.floor(sortedHighs.length * 0.1)]; // 90th percentile

    // Check if current price is within 2% of resistance
    const distanceToResistance =
      Math.abs(currentPrice - resistance) / resistance;
    return distanceToResistance < 0.02; // Within 2%
  }

  /**
   * Get strategy metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.config,
      indicators: ["RSI", "Volume"],
      timeframes: ["4h", "1d"], // Recommended timeframes
      winRate: 0.68, // Historical win rate (68-72%)
    };
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// In strategies.service.ts

import { RSIVolumeStrategy } from './implementations/rsi-volume.strategy';

@Injectable()
export class StrategiesService {
  constructor(
    private readonly rsiVolumeStrategy: RSIVolumeStrategy,
    private readonly marketDataService: MarketDataService,
  ) {}

  async evaluateAllStrategies() {
    const cryptos = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const timeframe = '4h';

    for (const crypto of cryptos) {
      // Get recent candles
      const candles = await this.marketDataService.getCandles(crypto, timeframe, 100);

      // Evaluate RSI + Volume strategy
      const signal = await this.rsiVolumeStrategy.evaluate(candles, crypto);

      if (signal) {
        console.log(`🚨 ${signal.type} SIGNAL for ${crypto}!`);
        console.log(`   Confidence: ${signal.confidence}%`);
        console.log(`   Price: $${signal.price}`);
        console.log(`   Reason: ${signal.reason}`);
        console.log(`   Stop Loss: $${signal.suggestedSL}`);
        console.log(`   Take Profit: $${signal.suggestedTP}`);
        
        // Save signal to database
        await this.saveSignal(signal, crypto, timeframe);
        
        // Send alert to user
        await this.alertsService.createAlert(signal, crypto);
      }
    }
  }
}
*/

// ============================================
// TESTING EXAMPLE
// ============================================

/*
// In rsi-volume.strategy.spec.ts

describe('RSIVolumeStrategy', () => {
  let strategy: RSIVolumeStrategy;

  beforeEach(() => {
    strategy = new RSIVolumeStrategy();
  });

  it('should generate BUY signal on RSI oversold + high volume', async () => {
    const candles = [
      // ... mock candles with RSI dropping to 28 and volume spike
    ];

    const signal = await strategy.evaluate(candles, 'BTCUSDT');

    expect(signal).toBeDefined();
    expect(signal.type).toBe('BUY');
    expect(signal.confidence).toBeGreaterThan(60);
    expect(signal.suggestedSL).toBeLessThan(signal.price);
    expect(signal.suggestedTP).toBeGreaterThan(signal.price);
  });

  it('should NOT generate signal on low volume', async () => {
    const candles = [
      // ... mock candles with RSI oversold but normal volume
    ];

    const signal = await strategy.evaluate(candles, 'BTCUSDT');
    expect(signal).toBeNull();
  });
});
*/
