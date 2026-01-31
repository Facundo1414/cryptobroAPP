import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { StrategiesService } from "../strategies/strategies.service";
import { CreateSignalDto } from "./dto/create-signal.dto";
import { Signal, SignalType } from "@prisma/client";

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategiesService: StrategiesService,
  ) {}

  /**
   * Create a new signal
   */
  async create(
    createSignalDto: CreateSignalDto,
    userId?: string,
  ): Promise<Signal> {
    this.logger.log(
      `Creating signal: ${createSignalDto.type} for crypto ${createSignalDto.cryptoId}`,
    );

    return this.prisma.signal.create({
      data: {
        userId: userId || "system",
        cryptoId: createSignalDto.cryptoId,
        strategyId: createSignalDto.strategyId,
        type: createSignalDto.type,
        price: createSignalDto.price,
        timeframe: createSignalDto.timeframe,
        confidence: createSignalDto.confidence,
        suggestedSL: createSignalDto.stopLoss,
        suggestedTP: createSignalDto.takeProfit,
        indicators: createSignalDto.metadata || {},
      },
      include: {
        crypto: true,
        strategy: true,
      },
    });
  }

  /**
   * Get all signals
   */
  async findAll(
    cryptoId?: string,
    strategyId?: string,
    type?: SignalType,
    limit: number = 50,
  ): Promise<Signal[]> {
    const where: any = {};

    if (cryptoId) where.cryptoId = cryptoId;
    if (strategyId) where.strategyId = strategyId;
    if (type) where.type = type;

    return this.prisma.signal.findMany({
      where,
      include: {
        crypto: true,
        strategy: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });
  }

  /**
   * Get a single signal
   */
  async findOne(id: string): Promise<Signal> {
    const signal = await this.prisma.signal.findUnique({
      where: { id },
      include: {
        crypto: true,
        strategy: true,
      },
    });

    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    return signal;
  }

  /**
   * Delete a signal
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.signal.delete({ where: { id } });
    this.logger.log(`Deleted signal: ${id}`);
  }

  /**
   * Generate signals for a specific crypto
   */
  async generateSignalsForCrypto(
    symbol: string,
    timeframe: string,
  ): Promise<any> {
    this.logger.log(`Generating signals for ${symbol} ${timeframe}`);

    try {
      // Get crypto from database
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { binanceSymbol: symbol },
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency ${symbol} not found`);
      }

      // Get consensus from all strategies
      const consensus = await this.strategiesService.getConsensusSignal(
        symbol,
        timeframe,
      );

      const generatedSignals: any[] = [];

      // Save signals from each strategy
      for (const [strategyName, result] of Object.entries(
        consensus.strategies,
      )) {
        if (result.signal) {
          // Find strategy by name (should be created beforehand)
          let strategy = await this.prisma.strategy.findFirst({
            where: { name: strategyName },
          });

          // If strategy doesn't exist, skip signal creation
          if (!strategy) {
            this.logger.warn(
              `Strategy ${strategyName} not found, skipping signal`,
            );
            continue;
          }

          // Create signal
          const signal = await this.prisma.signal.create({
            data: {
              userId: "system",
              cryptoId: crypto.id,
              strategyId: strategy.id,
              type: result.signal.type,
              price: result.signal.price,
              timeframe: result.signal.timeframe,
              confidence: result.signal.confidence,
              suggestedSL: result.signal.stopLoss,
              suggestedTP: result.signal.takeProfit,
              indicators: result.signal.metadata || {},
            },
            include: {
              crypto: true,
              strategy: true,
            },
          });

          generatedSignals.push(signal);
        }
      }

      this.logger.log(
        `Generated ${generatedSignals.length} signals for ${symbol}`,
      );

      return {
        symbol,
        timeframe,
        consensus: consensus.consensus,
        agreementRate: consensus.agreementRate,
        confidence: consensus.confidence,
        signals: generatedSignals,
      };
    } catch (error) {
      this.logger.error(`Error generating signals for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Generate signals for all active cryptos (scheduled task)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generateSignalsForAllCryptos(): Promise<void> {
    this.logger.log("🤖 Running scheduled signal generation...");

    try {
      const cryptos = await this.prisma.cryptocurrency.findMany({
        where: { isActive: true },
      });

      const timeframes = ["1h", "4h"];

      for (const crypto of cryptos) {
        for (const timeframe of timeframes) {
          try {
            await this.generateSignalsForCrypto(
              crypto.binanceSymbol,
              timeframe,
            );
          } catch (error) {
            this.logger.error(
              `Error generating signals for ${crypto.symbol} ${timeframe}`,
              error,
            );
          }
        }
      }

      this.logger.log("✅ Scheduled signal generation completed");
    } catch (error) {
      this.logger.error("Error in scheduled signal generation", error);
    }
  }

  /**
   * Get recent signals for a crypto
   */
  async getRecentSignals(
    symbol: string,
    limit: number = 10,
  ): Promise<Signal[]> {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { binanceSymbol: symbol },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${symbol} not found`);
    }

    return this.prisma.signal.findMany({
      where: { cryptoId: crypto.id },
      include: {
        strategy: true,
        crypto: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });
  }

  /**
   * Get signal statistics
   */
  async getStatistics(cryptoId?: string): Promise<any> {
    const where = cryptoId ? { cryptoId } : {};

    const [total, buySignals, sellSignals] = await Promise.all([
      this.prisma.signal.count({ where }),
      this.prisma.signal.count({ where: { ...where, type: SignalType.BUY } }),
      this.prisma.signal.count({ where: { ...where, type: SignalType.SELL } }),
    ]);

    const avgConfidence = await this.prisma.signal.aggregate({
      where,
      _avg: {
        confidence: true,
      },
    });

    return {
      total,
      buySignals,
      sellSignals,
      averageConfidence: avgConfidence._avg?.confidence || 0,
    };
  }

  private getStrategyDescription(strategyName: string): string {
    const descriptions = {
      RSI_VOLUME: "RSI with Volume Confirmation - Win Rate: 68-72%",
      EMA_RIBBON: "EMA Ribbon Strategy - Win Rate: 65-70%",
      MACD_RSI: "MACD + RSI Confluence - Win Rate: 63-68%",
    };
    return descriptions[strategyName] || strategyName;
  }
}
