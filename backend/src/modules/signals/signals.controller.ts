import { Controller, Get, Post, Delete, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { SignalsService } from "./signals.service";
import { SignalGeneratorService } from "./signal-generator.service";
import { SignalType } from "@prisma/client";

@ApiTags("signals")
@Controller("signals")
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly signalGenerator: SignalGeneratorService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all signals" })
  @ApiQuery({ name: "cryptoId", required: false })
  @ApiQuery({ name: "strategyId", required: false })
  @ApiQuery({ name: "type", required: false, enum: SignalType })
  @ApiQuery({ name: "limit", required: false, example: 50 })
  findAll(
    @Query("cryptoId") cryptoId?: string,
    @Query("strategyId") strategyId?: string,
    @Query("type") type?: SignalType,
    @Query("limit") limit?: number,
  ) {
    return this.signalsService.findAll(cryptoId, strategyId, type, limit);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get signal statistics" })
  @ApiQuery({ name: "cryptoId", required: false })
  getStatistics(@Query("cryptoId") cryptoId?: string) {
    return this.signalsService.getStatistics(cryptoId);
  }

  @Get("recent")
  @ApiOperation({ summary: "Get recent signals across all cryptos" })
  @ApiQuery({ name: "limit", required: false, example: 5 })
  getRecentAll(@Query("limit") limit?: number) {
    return this.signalsService.findAll(
      undefined,
      undefined,
      undefined,
      limit || 5,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a signal by ID" })
  findOne(@Param("id") id: string) {
    return this.signalsService.findOne(id);
  }

  @Get("crypto/:symbol")
  @ApiOperation({ summary: "Get recent signals for a crypto" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  getRecentSignals(
    @Param("symbol") symbol: string,
    @Query("limit") limit?: number,
  ) {
    return this.signalsService.getRecentSignals(symbol, limit);
  }

  @Post("generate/:symbol")
  @ApiOperation({ summary: "Generate signals for a specific crypto" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  generateSignals(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h",
  ) {
    return this.signalsService.generateSignalsForCrypto(symbol, timeframe);
  }

  @Delete(":id")
  @Post("generate-all")
  @ApiOperation({ summary: "Trigger signal generation for all active cryptos" })
  async generateAllSignals() {
    await this.signalGenerator.queueSignalGeneration();
    const stats = await this.signalGenerator.getQueueStats();
    return {
      message: "Signal generation jobs queued successfully",
      queueStats: stats,
    };
  }

  @Get("queue/stats")
  @ApiOperation({ summary: "Get signal generation queue statistics" })
  getQueueStats() {
    return this.signalGenerator.getQueueStats();
  }
  @ApiOperation({ summary: "Delete a signal" })
  remove(@Param("id") id: string) {
    return this.signalsService.remove(id);
  }
}
