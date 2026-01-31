import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SignalGeneratorService } from "./signal-generator.service";

/**
 * Signal Generation Cron Jobs
 *
 * Schedules automatic signal generation at regular intervals
 */
@Injectable()
export class SignalGenerationCron {
  private readonly logger = new Logger(SignalGenerationCron.name);

  constructor(private readonly signalGenerator: SignalGeneratorService) {}

  /**
   * Generate signals every 5 minutes
   * Analyzes top cryptocurrencies for trading opportunities
   */
  @Cron("*/5 * * * *", {
    name: "signal-generation-5min",
    timeZone: "UTC",
  })
  async generateSignalsEvery5Minutes() {
    this.logger.log("🤖 Running 5-minute signal generation cron job...");

    try {
      await this.signalGenerator.queueSignalGeneration();

      const stats = await this.signalGenerator.getQueueStats();
      this.logger.log(
        `Queue stats - Waiting: ${stats.waiting}, Active: ${stats.active}, Completed: ${stats.completed}, Failed: ${stats.failed}`,
      );
    } catch (error) {
      this.logger.error("Error in 5-minute signal generation cron", error);
    }
  }

  /**
   * Clean old queue jobs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: "queue-cleanup",
    timeZone: "UTC",
  })
  async cleanQueue() {
    this.logger.log("🧹 Cleaning old queue jobs...");

    try {
      await this.signalGenerator.cleanQueue();
    } catch (error) {
      this.logger.error("Error cleaning queue", error);
    }
  }

  /**
   * Log queue statistics every 15 minutes
   */
  @Cron("*/15 * * * *", {
    name: "queue-stats",
    timeZone: "UTC",
  })
  async logQueueStats() {
    try {
      const stats = await this.signalGenerator.getQueueStats();
      this.logger.log(
        `📊 Queue Statistics - Waiting: ${stats.waiting}, Active: ${stats.active}, Total: ${stats.total}`,
      );
    } catch (error) {
      this.logger.error("Error getting queue stats", error);
    }
  }
}
