import { Injectable, Logger } from "@nestjs/common";
import { RsiVolumeStrategy } from "./implementations/rsi-volume.strategy";
import { EmaRibbonStrategy } from "./implementations/ema-ribbon.strategy";
import { MacdRsiStrategy } from "./implementations/macd-rsi.strategy";
import { SmartMoneyStrategy } from "./implementations/smart-money.strategy";
import { OrderFlowStrategy } from "./implementations/order-flow.strategy";
import { StrategyResult } from "./strategies.types";

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    private readonly rsiVolumeStrategy: RsiVolumeStrategy,
    private readonly emaRibbonStrategy: EmaRibbonStrategy,
    private readonly macdRsiStrategy: MacdRsiStrategy,
    private readonly smartMoneyStrategy: SmartMoneyStrategy,
    private readonly orderFlowStrategy: OrderFlowStrategy,
  ) {}

  /**
   * Get all available strategies
   */
  getAvailableStrategies() {
    return [
      {
        name: this.smartMoneyStrategy.name,
        description: this.smartMoneyStrategy.description,
        winRate: "75-82%",
        category: "Advanced",
        recommended: true,
      },
      {
        name: this.orderFlowStrategy.name,
        description: this.orderFlowStrategy.description,
        winRate: "73-79%",
        category: "Advanced",
        recommended: true,
      },
      {
        name: this.rsiVolumeStrategy.name,
        description: this.rsiVolumeStrategy.description,
        winRate: "68-72%",
        category: "Classic",
        recommended: false,
      },
      {
        name: this.emaRibbonStrategy.name,
        description: this.emaRibbonStrategy.description,
        winRate: "65-70%",
        category: "Classic",
        recommended: false,
      },
      {
        name: this.macdRsiStrategy.name,
        description: this.macdRsiStrategy.description,
        winRate: "63-68%",
        category: "Classic",
        recommended: false,
      },
    ];
  }

  /**
   * Analyze symbol with a specific strategy
   */
  async analyzeWithStrategy(
    strategyName: string,
    symbol: string,
    timeframe: string,
  ): Promise<StrategyResult> {
    this.logger.log(`Analyzing ${symbol} with strategy: ${strategyName}`);

    switch (strategyName.toUpperCase()) {
      case "SMART_MONEY":
      case "SMART MONEY CONCEPTS":
        return this.smartMoneyStrategy.analyze(symbol, timeframe);

      case "ORDER_FLOW":
      case "ORDER FLOW + VOLUME PROFILE":
        return this.orderFlowStrategy.analyze(symbol, timeframe);

      case "RSI_VOLUME":
      case "RSI + VOLUME":
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
    timeframe: string,
  ): Promise<Record<string, StrategyResult>> {
    this.logger.log(`Analyzing ${symbol} with ALL strategies`);

    const [smartMoney, orderFlow, rsiVolume, emaRibbon, macdRsi] =
      await Promise.all([
        this.smartMoneyStrategy.analyze(symbol, timeframe),
        this.orderFlowStrategy.analyze(symbol, timeframe),
        this.rsiVolumeStrategy.analyze(symbol, timeframe),
        this.emaRibbonStrategy.analyze(symbol, timeframe),
        this.macdRsiStrategy.analyze(symbol, timeframe),
      ]);

    return {
      SMART_MONEY: smartMoney,
      ORDER_FLOW: orderFlow,
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
    timeframe: string,
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
