import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from "@/common/prisma/prisma.service";
import { StrategiesService } from "../strategies/strategies.service";
import { WebsocketGateway } from "../websocket/websocket.gateway";
import { SignalPayload } from "../websocket/websocket.types";
import { NotificationService } from "../notifications/notification.service";

export interface SignalGenerationJob {
  symbol: string;
  binanceSymbol: string;
  timeframe: string;
  cryptoId: string;
}

/**
 * Signal Generator Service
 *
 * Handles automatic signal generation for cryptocurrencies
 * Uses BullMQ for distributed processing
 */
@Injectable()
export class SignalGeneratorService {
  private readonly logger = new Logger(SignalGeneratorService.name);

  // Top cryptocurrencies to monitor
  private readonly TOP_CRYPTOS = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "MATICUSDT",
    "DOTUSDT",
    "LTCUSDT",
    "AVAXUSDT",
    "LINKUSDT",
    "UNIUSDT",
    "ATOMUSDT",
    "NEARUSDT",
    "APTUSDT",
    "ARBUSDT",
    "OPUSDT",
    "SUIUSDT",
    "INJUSDT",
  ];

  private readonly TIMEFRAMES = ["5m", "15m", "1h", "4h"];

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategiesService: StrategiesService,
    private readonly websocketGateway: WebsocketGateway,
    @Optional() private readonly notificationService?: NotificationService,
    @Optional() @InjectQueue("signal-generation") private signalQueue?: Queue,
  ) {
    if (!this.signalQueue) {
      this.logger.warn(
        "⚠️ Bull Queue not available. Signal generation will run synchronously.",
      );
    }
  }

  /**
   * Queue signal generation jobs for all active cryptos
   */
  async queueSignalGeneration(): Promise<void> {
    this.logger.log("🚀 Queueing signal generation jobs...");

    try {
      // Get active cryptocurrencies from database
      const cryptos = await this.prisma.cryptocurrency.findMany({
        where: {
          isActive: true,
          binanceSymbol: { in: this.TOP_CRYPTOS },
        },
      });

      if (cryptos.length === 0) {
        this.logger.warn(
          "No active cryptocurrencies found. Please run crypto seed first.",
        );
        return;
      }

      let jobCount = 0;

      // Queue jobs for each crypto and timeframe
      for (const crypto of cryptos) {
        for (const timeframe of this.TIMEFRAMES) {
          const job: SignalGenerationJob = {
            symbol: crypto.symbol,
            binanceSymbol: crypto.binanceSymbol,
            timeframe,
            cryptoId: crypto.id,
          };

          if (this.signalQueue) {
            // Use queue if available
            await this.signalQueue.add("generate-signal", job, {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 2000,
              },
              removeOnComplete: true,
              removeOnFail: false,
            });
          } else {
            // Process synchronously if no queue
            await this.processSignalGeneration(job);
          }

          jobCount++;
        }
      }

      this.logger.log(
        `✅ Queued ${jobCount} signal generation jobs for ${cryptos.length} cryptocurrencies`,
      );
    } catch (error) {
      this.logger.error("Error queueing signal generation jobs", error);
      throw error;
    }
  }

  /**
   * Process a single signal generation job
   * This is called by the Bull processor
   */
  async processSignalGeneration(job: SignalGenerationJob): Promise<any> {
    const { symbol, binanceSymbol, timeframe, cryptoId } = job;

    this.logger.log(`Processing signal generation for ${symbol} ${timeframe}`);

    try {
      // Get consensus from all strategies
      const consensus = await this.strategiesService.getConsensusSignal(
        binanceSymbol,
        timeframe,
      );

      const generatedSignals: any[] = [];

      // Process signals from each strategy
      for (const [strategyName, result] of Object.entries(
        consensus.strategies,
      )) {
        if (result.signal) {
          // Find or create strategy
          let strategy = await this.prisma.strategy.findFirst({
            where: { name: strategyName },
          });

          if (!strategy) {
            // Create strategy if it doesn't exist
            // Note: Strategies require userId. For auto-generated signals,
            // we'll skip creating strategies and only use existing ones.
            // TODO: Create a system user or modify schema to allow system strategies
            this.logger.warn(
              `Strategy ${strategyName} not found in database, skipping signal creation`,
            );
            continue;
          }

          // Check if similar signal already exists (within last 15 minutes)
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
          const existingSignal = await this.prisma.signal.findFirst({
            where: {
              cryptoId,
              strategyId: strategy.id,
              type: result.signal.type,
              timeframe,
              timestamp: {
                gte: fifteenMinutesAgo,
              },
            },
          });

          if (existingSignal) {
            this.logger.debug(
              `Similar signal already exists for ${symbol} ${strategyName}, skipping`,
            );
            continue;
          }

          // Skip HOLD signals, only process BUY/SELL
          if (result.signal.type !== "BUY" && result.signal.type !== "SELL") {
            this.logger.debug(
              `Skipping ${result.signal.type} signal for ${symbol} ${strategyName}`,
            );
            continue;
          }

          // Create new signal
          const signal = await this.prisma.signal.create({
            data: {
              userId: "system",
              cryptoId,
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

          // Broadcast signal via WebSocket
          const signalPayload: SignalPayload = {
            id: signal.id,
            cryptoSymbol: symbol,
            type: signal.type,
            strategy: strategyName,
            price: signal.price,
            confidence: signal.confidence,
            reason: result.signal.reasoning || "Signal generated",
            timestamp: signal.timestamp.getTime(),
          };

          this.websocketGateway.broadcastSignal(signalPayload);

          // Send Telegram notification for high-confidence signals
          if (this.notificationService && signal.confidence >= 0.7) {
            try {
              await this.notificationService.sendSignalNotification({
                type: signal.type as 'BUY' | 'SELL',
                cryptoSymbol: symbol,
                price: signal.price,
                confidence: Math.round(signal.confidence * 100),
                strategy: strategyName,
                stopLoss: signal.suggestedSL || undefined,
                takeProfit: signal.suggestedTP || undefined,
                reasoning: result.signal.reasoning,
              });
              this.logger.log(`📱 Telegram notification sent for ${symbol} ${signal.type}`);
            } catch (notifError) {
              this.logger.warn(`Failed to send Telegram notification: ${notifError.message}`);
            }
          }

          this.logger.log(
            `✅ Generated ${signal.type} signal for ${symbol} using ${strategyName} (confidence: ${(signal.confidence * 100).toFixed(0)}%)`,
          );
        }
      }

      return {
        symbol,
        timeframe,
        consensus: consensus.consensus,
        agreementRate: consensus.agreementRate,
        confidence: consensus.confidence,
        signalsGenerated: generatedSignals.length,
        signals: generatedSignals,
      };
    } catch (error) {
      this.logger.error(
        `Error processing signal generation for ${symbol} ${timeframe}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get strategy description
   */
  private getStrategyDescription(strategyName: string): string {
    const descriptions: Record<string, string> = {
      RSI_VOLUME: "RSI with Volume Confirmation - Win Rate: 68-72%",
      EMA_RIBBON: "EMA Ribbon Strategy - Win Rate: 65-70%",
      MACD_RSI: "MACD + RSI Confluence - Win Rate: 63-68%",
    };
    return descriptions[strategyName] || strategyName;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    if (!this.signalQueue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        total: 0,
        disabled: true,
        message: "Queue is disabled (Redis not available)",
      };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.signalQueue.getWaitingCount(),
      this.signalQueue.getActiveCount(),
      this.signalQueue.getCompletedCount(),
      this.signalQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(): Promise<void> {
    if (!this.signalQueue) {
      this.logger.warn("Queue not available for cleaning");
      return;
    }

    await this.signalQueue.clean(24 * 60 * 60 * 1000, "completed"); // 24 hours
    await this.signalQueue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // 7 days
    this.logger.log("Queue cleaned");
  }
}
