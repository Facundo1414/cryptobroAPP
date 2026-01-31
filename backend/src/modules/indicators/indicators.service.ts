import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import * as TI from "technicalindicators";
import {
  RSIResult,
  MACDResult,
  EMAResult,
  EMARibbonResult,
  BollingerBandsResult,
  VolumeAnalysis,
  ComprehensiveAnalysis,
  ATRResult,
  VWAPResult,
  StochRSIResult,
  OBVResult,
  SupertrendResult,
  PivotPointsResult,
  FibonacciResult,
  IchimokuResult,
  ADXResult,
  CCIResult,
  WilliamsRResult,
  MFIResult,
  ExtendedAnalysis,
} from "./indicators.types";

@Injectable()
export class IndicatorsService {
  private readonly logger = new Logger(IndicatorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate RSI (Relative Strength Index)
   */
  async calculateRSI(
    symbol: string,
    timeframe: string,
    period: number = 14,
  ): Promise<RSIResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 10);

      if (candles.length < period) {
        this.logger.warn(`Not enough data to calculate RSI for ${symbol}`);
        return null;
      }

      const closePrices = candles.map((c) => c.close);

      const rsiValues = TI.RSI.calculate({
        values: closePrices,
        period,
      });

      const latestRSI = rsiValues[rsiValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      let signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
      if (latestRSI < 30) {
        signal = "OVERSOLD";
      } else if (latestRSI > 70) {
        signal = "OVERBOUGHT";
      } else {
        signal = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        value: latestRSI,
        period,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating RSI for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  async calculateMACD(
    symbol: string,
    timeframe: string,
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ): Promise<MACDResult | null> {
    try {
      const candles = await this.getCandles(
        symbol,
        timeframe,
        slowPeriod + signalPeriod + 10,
      );

      if (candles.length < slowPeriod + signalPeriod) {
        this.logger.warn(`Not enough data to calculate MACD for ${symbol}`);
        return null;
      }

      const closePrices = candles.map((c) => c.close);

      const macdValues = TI.MACD.calculate({
        values: closePrices,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });

      const latestMACD = macdValues[macdValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      if (
        !latestMACD ||
        latestMACD.histogram === undefined ||
        latestMACD.MACD === undefined ||
        latestMACD.signal === undefined
      ) {
        return null;
      }

      let trend: "BULLISH" | "BEARISH" | "NEUTRAL";
      if (latestMACD.histogram > 0 && latestMACD.MACD > latestMACD.signal) {
        trend = "BULLISH";
      } else if (
        latestMACD.histogram < 0 &&
        latestMACD.MACD < latestMACD.signal
      ) {
        trend = "BEARISH";
      } else {
        trend = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        macd: latestMACD.MACD,
        signal: latestMACD.signal,
        histogram: latestMACD.histogram,
        trend,
      };
    } catch (error) {
      this.logger.error(`Error calculating MACD for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate single EMA (Exponential Moving Average)
   */
  async calculateEMA(
    symbol: string,
    timeframe: string,
    period: number,
  ): Promise<EMAResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 10);

      if (candles.length < period) {
        this.logger.warn(`Not enough data to calculate EMA for ${symbol}`);
        return null;
      }

      const closePrices = candles.map((c) => c.close);

      const emaValues = TI.EMA.calculate({
        values: closePrices,
        period,
      });

      const latestEMA = emaValues[emaValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        value: latestEMA,
        period,
      };
    } catch (error) {
      this.logger.error(`Error calculating EMA for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate EMA Ribbon (5 EMAs: 5, 10, 20, 50, 200)
   */
  async calculateEMARibbon(
    symbol: string,
    timeframe: string,
  ): Promise<EMARibbonResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, 210);

      if (candles.length < 200) {
        this.logger.warn(
          `Not enough data to calculate EMA Ribbon for ${symbol}`,
        );
        return null;
      }

      const closePrices = candles.map((c) => c.close);
      const latestCandle = candles[candles.length - 1];

      const ema5 = this.getLatestEMA(closePrices, 5);
      const ema10 = this.getLatestEMA(closePrices, 10);
      const ema20 = this.getLatestEMA(closePrices, 20);
      const ema50 = this.getLatestEMA(closePrices, 50);
      const ema200 = this.getLatestEMA(closePrices, 200);

      // Check alignment: bullish if shorter EMAs are above longer EMAs
      let alignment: "BULLISH" | "BEARISH" | "MIXED";
      const bullishAlignment =
        ema5 > ema10 && ema10 > ema20 && ema20 > ema50 && ema50 > ema200;
      const bearishAlignment =
        ema5 < ema10 && ema10 < ema20 && ema20 < ema50 && ema50 < ema200;

      if (bullishAlignment) {
        alignment = "BULLISH";
      } else if (bearishAlignment) {
        alignment = "BEARISH";
      } else {
        alignment = "MIXED";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        ema5,
        ema10,
        ema20,
        ema50,
        ema200,
        alignment,
      };
    } catch (error) {
      this.logger.error(`Error calculating EMA Ribbon for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Bollinger Bands
   */
  async calculateBollingerBands(
    symbol: string,
    timeframe: string,
    period: number = 20,
    stdDev: number = 2,
  ): Promise<BollingerBandsResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 10);

      if (candles.length < period) {
        this.logger.warn(
          `Not enough data to calculate Bollinger Bands for ${symbol}`,
        );
        return null;
      }

      const closePrices = candles.map((c) => c.close);

      const bbValues = TI.BollingerBands.calculate({
        values: closePrices,
        period,
        stdDev,
      });

      const latestBB = bbValues[bbValues.length - 1];
      const latestCandle = candles[candles.length - 1];
      const currentPrice = latestCandle.close;

      let position: "ABOVE_UPPER" | "BETWEEN" | "BELOW_LOWER";
      if (currentPrice > latestBB.upper) {
        position = "ABOVE_UPPER";
      } else if (currentPrice < latestBB.lower) {
        position = "BELOW_LOWER";
      } else {
        position = "BETWEEN";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        upper: latestBB.upper,
        middle: latestBB.middle,
        lower: latestBB.lower,
        currentPrice,
        position,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating Bollinger Bands for ${symbol}`,
        error,
      );
      return null;
    }
  }

  /**
   * Analyze volume
   */
  async analyzeVolume(
    symbol: string,
    timeframe: string,
    lookbackPeriod: number = 20,
  ): Promise<VolumeAnalysis | null> {
    try {
      const candles = await this.getCandles(
        symbol,
        timeframe,
        lookbackPeriod + 1,
      );

      if (candles.length < lookbackPeriod) {
        this.logger.warn(`Not enough data to analyze volume for ${symbol}`);
        return null;
      }

      const latestCandle = candles[candles.length - 1];
      const currentVolume = latestCandle.volume;

      // Calculate average volume excluding current candle
      const volumes = candles.slice(0, -1).map((c) => c.volume);
      const avgVolume =
        volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

      const volumeRatio = currentVolume / avgVolume;
      const isSignificant = volumeRatio > 1.5; // 50% above average

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        currentVolume,
        avgVolume,
        volumeRatio,
        isSignificant,
      };
    } catch (error) {
      this.logger.error(`Error analyzing volume for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Comprehensive analysis combining all indicators
   */
  async getComprehensiveAnalysis(
    symbol: string,
    timeframe: string,
  ): Promise<ComprehensiveAnalysis | null> {
    try {
      this.logger.log(
        `Performing comprehensive analysis for ${symbol} ${timeframe}`,
      );

      const [rsi, macd, emaRibbon, bollinger, volume] = await Promise.all([
        this.calculateRSI(symbol, timeframe),
        this.calculateMACD(symbol, timeframe),
        this.calculateEMARibbon(symbol, timeframe),
        this.calculateBollingerBands(symbol, timeframe),
        this.analyzeVolume(symbol, timeframe),
      ]);

      if (!rsi || !macd || !emaRibbon || !bollinger || !volume) {
        this.logger.warn(
          `Incomplete data for comprehensive analysis of ${symbol}`,
        );
        return null;
      }

      // Calculate overall signal based on indicators
      let bullishScore = 0;
      let bearishScore = 0;

      // RSI scoring
      if (rsi.signal === "OVERSOLD") bullishScore += 2;
      if (rsi.signal === "OVERBOUGHT") bearishScore += 2;

      // MACD scoring
      if (macd.trend === "BULLISH") bullishScore += 2;
      if (macd.trend === "BEARISH") bearishScore += 2;

      // EMA Ribbon scoring
      if (emaRibbon.alignment === "BULLISH") bullishScore += 2;
      if (emaRibbon.alignment === "BEARISH") bearishScore += 2;

      // Bollinger Bands scoring
      if (bollinger.position === "BELOW_LOWER") bullishScore += 1;
      if (bollinger.position === "ABOVE_UPPER") bearishScore += 1;

      // Volume confirmation
      if (volume.isSignificant) {
        if (bullishScore > bearishScore) bullishScore += 1;
        if (bearishScore > bullishScore) bearishScore += 1;
      }

      const totalScore = bullishScore + bearishScore;
      const confidence =
        totalScore > 0 ? Math.max(bullishScore, bearishScore) / 10 : 0;

      let overallSignal:
        | "STRONG_BUY"
        | "BUY"
        | "NEUTRAL"
        | "SELL"
        | "STRONG_SELL";
      if (bullishScore >= 6) overallSignal = "STRONG_BUY";
      else if (bullishScore >= 4) overallSignal = "BUY";
      else if (bearishScore >= 6) overallSignal = "STRONG_SELL";
      else if (bearishScore >= 4) overallSignal = "SELL";
      else overallSignal = "NEUTRAL";

      const latestCandle = await this.getLatestCandle(symbol, timeframe);

      if (!latestCandle) {
        throw new Error(`No candle data found for ${symbol}`);
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        price: latestCandle.close,
        rsi,
        macd,
        emaRibbon,
        bollinger,
        volume,
        overallSignal,
        confidence,
      };
    } catch (error) {
      this.logger.error(`Error in comprehensive analysis for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get candles from database
   */
  private async getCandles(symbol: string, timeframe: string, limit: number) {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { binanceSymbol: symbol },
    });

    if (!crypto) {
      throw new Error(`Cryptocurrency ${symbol} not found`);
    }

    return this.prisma.priceData.findMany({
      where: {
        cryptoId: crypto.id,
        timeframe,
      },
      orderBy: {
        timestamp: "asc",
      },
      take: limit,
    });
  }

  /**
   * Get latest candle
   */
  private async getLatestCandle(symbol: string, timeframe: string) {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { binanceSymbol: symbol },
    });

    if (!crypto) {
      throw new Error(`Cryptocurrency ${symbol} not found`);
    }

    return this.prisma.priceData.findFirst({
      where: {
        cryptoId: crypto.id,
        timeframe,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Helper to get latest EMA value
   */
  private getLatestEMA(values: number[], period: number): number {
    const emaValues = TI.EMA.calculate({
      values,
      period,
    });
    return emaValues[emaValues.length - 1];
  }

  // ============================================
  // NUEVOS INDICADORES - Sprint 6
  // ============================================

  /**
   * Calculate ATR (Average True Range) - Volatility indicator
   */
  async calculateATR(
    symbol: string,
    timeframe: string,
    period: number = 14,
  ): Promise<ATRResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 20);

      if (candles.length < period + 1) {
        this.logger.warn(`Not enough data to calculate ATR for ${symbol}`);
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);

      const atrValues = TI.ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });

      const latestATR = atrValues[atrValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      // Calculate average ATR for volatility classification
      const avgATR =
        atrValues.reduce((sum, val) => sum + val, 0) / atrValues.length;
      const atrRatio = latestATR / avgATR;

      let volatility: "LOW" | "MEDIUM" | "HIGH";
      if (atrRatio < 0.7) {
        volatility = "LOW";
      } else if (atrRatio > 1.3) {
        volatility = "HIGH";
      } else {
        volatility = "MEDIUM";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        value: latestATR,
        period,
        volatility,
      };
    } catch (error) {
      this.logger.error(`Error calculating ATR for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   */
  async calculateVWAP(
    symbol: string,
    timeframe: string,
  ): Promise<VWAPResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, 50);

      if (candles.length < 10) {
        this.logger.warn(`Not enough data to calculate VWAP for ${symbol}`);
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);
      const volumes = candles.map((c) => c.volume);

      const vwapValues = TI.VWAP.calculate({
        high: highs,
        low: lows,
        close: closes,
        volume: volumes,
      });

      const latestVWAP = vwapValues[vwapValues.length - 1];
      const latestCandle = candles[candles.length - 1];
      const currentPrice = latestCandle.close;
      const deviation = ((currentPrice - latestVWAP) / latestVWAP) * 100;

      let signal: "ABOVE_VWAP" | "BELOW_VWAP" | "AT_VWAP";
      if (deviation > 1) {
        signal = "ABOVE_VWAP";
      } else if (deviation < -1) {
        signal = "BELOW_VWAP";
      } else {
        signal = "AT_VWAP";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        vwap: latestVWAP,
        currentPrice,
        deviation,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating VWAP for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Stochastic RSI
   */
  async calculateStochRSI(
    symbol: string,
    timeframe: string,
    rsiPeriod: number = 14,
    stochPeriod: number = 14,
    kPeriod: number = 3,
    dPeriod: number = 3,
  ): Promise<StochRSIResult | null> {
    try {
      const candles = await this.getCandles(
        symbol,
        timeframe,
        rsiPeriod + stochPeriod + 50,
      );

      if (candles.length < rsiPeriod + stochPeriod) {
        this.logger.warn(`Not enough data to calculate StochRSI for ${symbol}`);
        return null;
      }

      const closePrices = candles.map((c) => c.close);

      const stochRSIValues = TI.StochasticRSI.calculate({
        values: closePrices,
        rsiPeriod,
        stochasticPeriod: stochPeriod,
        kPeriod,
        dPeriod,
      });

      const latest = stochRSIValues[stochRSIValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      let signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
      if (latest.k < 20 && latest.d < 20) {
        signal = "OVERSOLD";
      } else if (latest.k > 80 && latest.d > 80) {
        signal = "OVERBOUGHT";
      } else {
        signal = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        stochRSI: latest.stochRSI,
        k: latest.k,
        d: latest.d,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating StochRSI for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate OBV (On-Balance Volume)
   */
  async calculateOBV(
    symbol: string,
    timeframe: string,
    emaPeriod: number = 20,
  ): Promise<OBVResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, 100);

      if (candles.length < emaPeriod + 10) {
        this.logger.warn(`Not enough data to calculate OBV for ${symbol}`);
        return null;
      }

      const closePrices = candles.map((c) => c.close);
      const volumes = candles.map((c) => c.volume);

      const obvValues = TI.OBV.calculate({
        close: closePrices,
        volume: volumes,
      });

      const latestOBV = obvValues[obvValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      // Calculate OBV EMA for trend
      const obvEMAValues = TI.EMA.calculate({
        values: obvValues,
        period: emaPeriod,
      });
      const obvEMA = obvEMAValues[obvEMAValues.length - 1];

      let trend: "BULLISH" | "BEARISH" | "NEUTRAL";
      const obvChange = latestOBV - obvEMA;
      const obvChangePercent = (obvChange / Math.abs(obvEMA)) * 100;

      if (obvChangePercent > 5) {
        trend = "BULLISH";
      } else if (obvChangePercent < -5) {
        trend = "BEARISH";
      } else {
        trend = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        obv: latestOBV,
        obvEMA,
        trend,
      };
    } catch (error) {
      this.logger.error(`Error calculating OBV for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Supertrend indicator
   */
  async calculateSupertrend(
    symbol: string,
    timeframe: string,
    period: number = 10,
    multiplier: number = 3,
  ): Promise<SupertrendResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 50);

      if (candles.length < period + 10) {
        this.logger.warn(
          `Not enough data to calculate Supertrend for ${symbol}`,
        );
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);

      // Calculate ATR first
      const atrValues = TI.ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });

      // Calculate Supertrend manually
      const supertrendValues: { value: number; direction: "UP" | "DOWN" }[] =
        [];

      for (let i = period; i < candles.length; i++) {
        const atr = atrValues[i - period];
        const hl2 = (highs[i] + lows[i]) / 2;

        const upperBand = hl2 + multiplier * atr;
        const lowerBand = hl2 - multiplier * atr;

        let direction: "UP" | "DOWN";
        let supertrend: number;

        if (i === period) {
          direction = closes[i] > upperBand ? "UP" : "DOWN";
          supertrend = direction === "UP" ? lowerBand : upperBand;
        } else {
          const prevSupertrend = supertrendValues[supertrendValues.length - 1];

          if (prevSupertrend.direction === "UP") {
            if (closes[i] < prevSupertrend.value) {
              direction = "DOWN";
              supertrend = upperBand;
            } else {
              direction = "UP";
              supertrend = Math.max(lowerBand, prevSupertrend.value);
            }
          } else {
            if (closes[i] > prevSupertrend.value) {
              direction = "UP";
              supertrend = lowerBand;
            } else {
              direction = "DOWN";
              supertrend = Math.min(upperBand, prevSupertrend.value);
            }
          }
        }

        supertrendValues.push({ value: supertrend, direction });
      }

      const latest = supertrendValues[supertrendValues.length - 1];
      const latestCandle = candles[candles.length - 1];
      const prev = supertrendValues[supertrendValues.length - 2];

      let signal: "BUY" | "SELL" | "HOLD";
      if (latest.direction === "UP" && prev.direction === "DOWN") {
        signal = "BUY";
      } else if (latest.direction === "DOWN" && prev.direction === "UP") {
        signal = "SELL";
      } else {
        signal = "HOLD";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        supertrend: latest.value,
        direction: latest.direction,
        currentPrice: latestCandle.close,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating Supertrend for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Pivot Points
   */
  async calculatePivotPoints(
    symbol: string,
    timeframe: string,
  ): Promise<PivotPointsResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, 2);

      if (candles.length < 2) {
        this.logger.warn(
          `Not enough data to calculate Pivot Points for ${symbol}`,
        );
        return null;
      }

      const prevCandle = candles[candles.length - 2];
      const currentCandle = candles[candles.length - 1];

      const high = prevCandle.high;
      const low = prevCandle.low;
      const close = prevCandle.close;
      const currentPrice = currentCandle.close;

      // Standard Pivot Points calculation
      const pivot = (high + low + close) / 3;
      const r1 = 2 * pivot - low;
      const s1 = 2 * pivot - high;
      const r2 = pivot + (high - low);
      const s2 = pivot - (high - low);
      const r3 = high + 2 * (pivot - low);
      const s3 = low - 2 * (high - pivot);

      // Find nearest level
      const levels = [
        { name: "S3", value: s3 },
        { name: "S2", value: s2 },
        { name: "S1", value: s1 },
        { name: "Pivot", value: pivot },
        { name: "R1", value: r1 },
        { name: "R2", value: r2 },
        { name: "R3", value: r3 },
      ];

      let nearestLevel = levels[0];
      let minDistance = Math.abs(currentPrice - levels[0].value);

      for (const level of levels) {
        const distance = Math.abs(currentPrice - level.value);
        if (distance < minDistance) {
          minDistance = distance;
          nearestLevel = level;
        }
      }

      return {
        symbol,
        timeframe,
        timestamp: currentCandle.timestamp,
        pivot,
        r1,
        r2,
        r3,
        s1,
        s2,
        s3,
        currentPrice,
        nearestLevel: nearestLevel.name,
      };
    } catch (error) {
      this.logger.error(`Error calculating Pivot Points for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Fibonacci Retracement levels
   */
  async calculateFibonacci(
    symbol: string,
    timeframe: string,
    lookback: number = 50,
  ): Promise<FibonacciResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, lookback);

      if (candles.length < lookback) {
        this.logger.warn(
          `Not enough data to calculate Fibonacci for ${symbol}`,
        );
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);

      const high = Math.max(...highs);
      const low = Math.min(...lows);
      const diff = high - low;
      const currentPrice = candles[candles.length - 1].close;

      const levels = {
        level0: low,
        level236: low + diff * 0.236,
        level382: low + diff * 0.382,
        level500: low + diff * 0.5,
        level618: low + diff * 0.618,
        level786: low + diff * 0.786,
        level1000: high,
      };

      // Find nearest Fibonacci level
      const levelValues = Object.entries(levels);
      let nearestLevel = levelValues[0][0];
      let minDistance = Math.abs(currentPrice - levelValues[0][1]);

      for (const [name, value] of levelValues) {
        const distance = Math.abs(currentPrice - value);
        if (distance < minDistance) {
          minDistance = distance;
          nearestLevel = name.replace("level", "");
        }
      }

      return {
        symbol,
        timeframe,
        high,
        low,
        levels,
        currentPrice,
        nearestLevel: `${nearestLevel}%`,
      };
    } catch (error) {
      this.logger.error(`Error calculating Fibonacci for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Ichimoku Cloud
   */
  async calculateIchimoku(
    symbol: string,
    timeframe: string,
    tenkanPeriod: number = 9,
    kijunPeriod: number = 26,
    senkouBPeriod: number = 52,
  ): Promise<IchimokuResult | null> {
    try {
      const candles = await this.getCandles(
        symbol,
        timeframe,
        senkouBPeriod + 30,
      );

      if (candles.length < senkouBPeriod) {
        this.logger.warn(`Not enough data to calculate Ichimoku for ${symbol}`);
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);

      const ichimokuValues = TI.IchimokuCloud.calculate({
        high: highs,
        low: lows,
        conversionPeriod: tenkanPeriod,
        basePeriod: kijunPeriod,
        spanPeriod: senkouBPeriod,
        displacement: kijunPeriod,
      });

      const latest = ichimokuValues[ichimokuValues.length - 1];
      const latestCandle = candles[candles.length - 1];
      const currentPrice = latestCandle.close;

      const cloudTop = Math.max(latest.spanA, latest.spanB);
      const cloudBottom = Math.min(latest.spanA, latest.spanB);
      const cloudColor: "GREEN" | "RED" =
        latest.spanA > latest.spanB ? "GREEN" : "RED";

      let priceLocation: "ABOVE_CLOUD" | "IN_CLOUD" | "BELOW_CLOUD";
      if (currentPrice > cloudTop) {
        priceLocation = "ABOVE_CLOUD";
      } else if (currentPrice < cloudBottom) {
        priceLocation = "BELOW_CLOUD";
      } else {
        priceLocation = "IN_CLOUD";
      }

      // Generate signal based on Ichimoku rules
      let signal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
      const bullishTKCross = latest.conversion > latest.base;
      const bullishCloud = cloudColor === "GREEN";
      const aboveCloud = priceLocation === "ABOVE_CLOUD";
      const belowCloud = priceLocation === "BELOW_CLOUD";

      if (aboveCloud && bullishTKCross && bullishCloud) {
        signal = "STRONG_BUY";
      } else if (aboveCloud && bullishTKCross) {
        signal = "BUY";
      } else if (belowCloud && !bullishTKCross && !bullishCloud) {
        signal = "STRONG_SELL";
      } else if (belowCloud && !bullishTKCross) {
        signal = "SELL";
      } else {
        signal = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        tenkanSen: latest.conversion,
        kijunSen: latest.base,
        senkouSpanA: latest.spanA,
        senkouSpanB: latest.spanB,
        chikouSpan: closes[closes.length - kijunPeriod] || currentPrice,
        cloudTop,
        cloudBottom,
        currentPrice,
        signal,
        cloudColor,
        priceLocation,
      };
    } catch (error) {
      this.logger.error(`Error calculating Ichimoku for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate ADX (Average Directional Index)
   */
  async calculateADX(
    symbol: string,
    timeframe: string,
    period: number = 14,
  ): Promise<ADXResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 30);

      if (candles.length < period + 10) {
        this.logger.warn(`Not enough data to calculate ADX for ${symbol}`);
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);

      const adxValues = TI.ADX.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });

      const latest = adxValues[adxValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      let trend: "STRONG_TREND" | "WEAK_TREND" | "NO_TREND";
      if (latest.adx > 25) {
        trend = "STRONG_TREND";
      } else if (latest.adx > 20) {
        trend = "WEAK_TREND";
      } else {
        trend = "NO_TREND";
      }

      let direction: "BULLISH" | "BEARISH" | "NEUTRAL";
      if (latest.pdi > latest.mdi) {
        direction = "BULLISH";
      } else if (latest.mdi > latest.pdi) {
        direction = "BEARISH";
      } else {
        direction = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        adx: latest.adx,
        plusDI: latest.pdi,
        minusDI: latest.mdi,
        trend,
        direction,
      };
    } catch (error) {
      this.logger.error(`Error calculating ADX for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate CCI (Commodity Channel Index)
   */
  async calculateCCI(
    symbol: string,
    timeframe: string,
    period: number = 20,
  ): Promise<CCIResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 20);

      if (candles.length < period) {
        this.logger.warn(`Not enough data to calculate CCI for ${symbol}`);
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);

      const cciValues = TI.CCI.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });

      const latestCCI = cciValues[cciValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      let signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
      if (latestCCI < -100) {
        signal = "OVERSOLD";
      } else if (latestCCI > 100) {
        signal = "OVERBOUGHT";
      } else {
        signal = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        value: latestCCI,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating CCI for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate Williams %R
   */
  async calculateWilliamsR(
    symbol: string,
    timeframe: string,
    period: number = 14,
  ): Promise<WilliamsRResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 10);

      if (candles.length < period) {
        this.logger.warn(
          `Not enough data to calculate Williams %R for ${symbol}`,
        );
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);

      const wrValues = TI.WilliamsR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });

      const latestWR = wrValues[wrValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      let signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
      if (latestWR < -80) {
        signal = "OVERSOLD";
      } else if (latestWR > -20) {
        signal = "OVERBOUGHT";
      } else {
        signal = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        value: latestWR,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating Williams %R for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate MFI (Money Flow Index)
   */
  async calculateMFI(
    symbol: string,
    timeframe: string,
    period: number = 14,
  ): Promise<MFIResult | null> {
    try {
      const candles = await this.getCandles(symbol, timeframe, period + 20);

      if (candles.length < period) {
        this.logger.warn(`Not enough data to calculate MFI for ${symbol}`);
        return null;
      }

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const closes = candles.map((c) => c.close);
      const volumes = candles.map((c) => c.volume);

      const mfiValues = TI.MFI.calculate({
        high: highs,
        low: lows,
        close: closes,
        volume: volumes,
        period,
      });

      const latestMFI = mfiValues[mfiValues.length - 1];
      const latestCandle = candles[candles.length - 1];

      let signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
      if (latestMFI < 20) {
        signal = "OVERSOLD";
      } else if (latestMFI > 80) {
        signal = "OVERBOUGHT";
      } else {
        signal = "NEUTRAL";
      }

      return {
        symbol,
        timeframe,
        timestamp: latestCandle.timestamp,
        value: latestMFI,
        signal,
      };
    } catch (error) {
      this.logger.error(`Error calculating MFI for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Extended comprehensive analysis with all new indicators
   */
  async getExtendedAnalysis(
    symbol: string,
    timeframe: string,
  ): Promise<ExtendedAnalysis | null> {
    try {
      this.logger.log(
        `Performing extended analysis for ${symbol} ${timeframe}`,
      );

      // Get base comprehensive analysis
      const baseAnalysis = await this.getComprehensiveAnalysis(
        symbol,
        timeframe,
      );

      if (!baseAnalysis) {
        return null;
      }

      // Get additional indicators in parallel
      const [atr, vwap, stochRSI, obv, supertrend, pivotPoints, ichimoku, adx] =
        await Promise.all([
          this.calculateATR(symbol, timeframe),
          this.calculateVWAP(symbol, timeframe),
          this.calculateStochRSI(symbol, timeframe),
          this.calculateOBV(symbol, timeframe),
          this.calculateSupertrend(symbol, timeframe),
          this.calculatePivotPoints(symbol, timeframe),
          this.calculateIchimoku(symbol, timeframe),
          this.calculateADX(symbol, timeframe),
        ]);

      // Enhance confidence score with additional indicators
      let additionalScore = 0;
      let additionalCount = 0;

      if (supertrend) {
        additionalCount++;
        if (
          supertrend.signal === "BUY" &&
          baseAnalysis.overallSignal.includes("BUY")
        ) {
          additionalScore += 1;
        } else if (
          supertrend.signal === "SELL" &&
          baseAnalysis.overallSignal.includes("SELL")
        ) {
          additionalScore += 1;
        }
      }

      if (ichimoku) {
        additionalCount++;
        if (
          ichimoku.signal.includes("BUY") &&
          baseAnalysis.overallSignal.includes("BUY")
        ) {
          additionalScore += 1;
        } else if (
          ichimoku.signal.includes("SELL") &&
          baseAnalysis.overallSignal.includes("SELL")
        ) {
          additionalScore += 1;
        }
      }

      if (adx && adx.trend === "STRONG_TREND") {
        additionalCount++;
        if (
          adx.direction === "BULLISH" &&
          baseAnalysis.overallSignal.includes("BUY")
        ) {
          additionalScore += 1;
        } else if (
          adx.direction === "BEARISH" &&
          baseAnalysis.overallSignal.includes("SELL")
        ) {
          additionalScore += 1;
        }
      }

      const enhancedConfidence =
        additionalCount > 0
          ? baseAnalysis.confidence + (additionalScore / additionalCount) * 0.2
          : baseAnalysis.confidence;

      return {
        ...baseAnalysis,
        confidence: Math.min(enhancedConfidence, 1), // Cap at 1
        atr: atr || undefined,
        vwap: vwap || undefined,
        stochRSI: stochRSI || undefined,
        obv: obv || undefined,
        supertrend: supertrend || undefined,
        pivotPoints: pivotPoints || undefined,
        ichimoku: ichimoku || undefined,
        adx: adx || undefined,
      };
    } catch (error) {
      this.logger.error(`Error in extended analysis for ${symbol}`, error);
      return null;
    }
  }
}
