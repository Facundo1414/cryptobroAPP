import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import {
  SignalGeneratorService,
  SignalGenerationJob,
} from "./signal-generator.service";

/**
 * Signal Generation Queue Processor
 *
 * Processes jobs from the signal-generation queue
 * Runs signal analysis for each crypto/timeframe combination
 */
@Processor("signal-generation")
export class SignalGenerationProcessor {
  private readonly logger = new Logger(SignalGenerationProcessor.name);

  constructor(private readonly signalGenerator: SignalGeneratorService) {}

  @Process("generate-signal")
  async handleSignalGeneration(job: Job<SignalGenerationJob>) {
    const { symbol, timeframe } = job.data;

    this.logger.debug(`Processing job ${job.id}: ${symbol} ${timeframe}`);

    try {
      const result = await this.signalGenerator.processSignalGeneration(
        job.data,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process signal generation for ${symbol} ${timeframe}`,
        error,
      );
      throw error;
    }
  }
}
