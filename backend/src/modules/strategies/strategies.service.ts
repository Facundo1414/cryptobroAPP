import { Injectable, Logger } from "@nestjs/common";
import { RsiVolumeStrategy } from "./implementations/rsi-volume.strategy";
import { EmaRibbonStrategy } from "./implementations/ema-ribbon.strategy";
import { MacdRsiStrategy } from "./implementations/macd-rsi.strategy";
import { StrategyResult } from "./strategies.types";

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    private readonly rsiVolumeStrategy: RsiVolumeStrategy,
    private readonly emaRibbonStrategy: EmaRibbonStrategy,
    private readonly macdRsiStrategy: MacdRsiStrategy
  ) {}

  /**
   * Get all available strategies
   */
  getAvailableStrategies() {
    return [
      {
        name: this.rsiVolumeStrategy.name,
        description: this.rsiVolumeStrategy.description,
        winRate: "68-72%",
      },
      {
        name: this.emaRibbonStrategy.name,
        description: this.emaRibbonStrategy.description,
        winRate: "65-70%",
      },
      {
        name: this.macdRsiStrategy.name,
        description: this.macdRsiStrategy.description,
        winRate: "63-68%",
      },
    ];
  }

  /**
   * Analyze symbol with a specific strategy
   */
  async analyzeWithStrategy(
    strategyName: string,
    symbol: string,
    timeframe: string
  ): Promise<StrategyResult> {
    this.logger.log(`Analyzing ${symbol} with strategy: ${strategyName}`);

    switch (strategyName.toUpperCase()) {
      case "RSI_VOLUME":
        return this.rsiVolumeStrategy.analyze(symbol, timeframe);

      case "EMA_RIBBON":
        return this.emaRibbonStrategy.analyze(symbol, timeframe);

      case "MACD_RSI":
        return this.macdRsiStrategy.analyze(symbol, timeframe);

      default:
        throw new Error(`Unknown strategy: ${strategyName}`);
    }
  }

  /**
   * Analyze symbol with all strategies
   */
  async analyzeWithAllStrategies(
    symbol: string,
    timeframe: string
  ): Promise<Record<string, StrategyResult>> {
    this.logger.log(`Analyzing ${symbol} with ALL strategies`);

    const [rsiVolume, emaRibbon, macdRsi] = await Promise.all([
      this.rsiVolumeStrategy.analyze(symbol, timeframe),
      this.emaRibbonStrategy.analyze(symbol, timeframe),
      this.macdRsiStrategy.analyze(symbol, timeframe),
    ]);

    return {
      RSI_VOLUME: rsiVolume,
      EMA_RIBBON: emaRibbon,
      MACD_RSI: macdRsi,
    };
  }

  /**
   * Get consensus signal from multiple strategies
   */
  async getConsensusSignal(
    symbol: string,
    timeframe: string
  ): Promise<{
    symbol: string;
    timeframe: string;
    consensus: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
    confidence: number;
    strategies: Record<string, StrategyResult>;
    agreementRate: number;
  }> {
    const strategies = await this.analyzeWithAllStrategies(symbol, timeframe);

    let buySignals = 0;
    let sellSignals = 0;
    let totalConfidence = 0;
    let activeStrategies = 0;

    Object.values(strategies).forEach((result) => {
      if (result.signal) {
        activeStrategies++;
        if (result.signal.type === "BUY") buySignals++;
        if (result.signal.type === "SELL") sellSignals++;
        totalConfidence += result.signal.confidence;
      }
    });

    const agreementRate =
      activeStrategies > 0
        ? Math.max(buySignals, sellSignals) / Object.keys(strategies).length
        : 0;

    const avgConfidence =
      activeStrategies > 0 ? totalConfidence / activeStrategies : 0;

    let consensus: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";

    if (buySignals === 3) {
      consensus = "STRONG_BUY"; // All 3 strategies agree
    } else if (buySignals === 2) {
      consensus = "BUY"; // 2 out of 3 agree
    } else if (sellSignals === 3) {
      consensus = "STRONG_SELL"; // All 3 strategies agree
    } else if (sellSignals === 2) {
      consensus = "SELL"; // 2 out of 3 agree
    } else {
      consensus = "NEUTRAL"; // No consensus
    }

    return {
      symbol,
      timeframe,
      consensus,
      confidence: avgConfidence,
      strategies,
      agreementRate,
    };
  }
}
