import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { StrategiesService } from "./strategies.service";

@ApiTags("strategies")
@Controller("strategies")
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Get()
  @ApiOperation({ summary: "Get all available trading strategies" })
  getAvailableStrategies() {
    return this.strategiesService.getAvailableStrategies();
  }

  @Get("analyze/:strategy/:symbol")
  @ApiOperation({ summary: "Analyze a symbol with a specific strategy" })
  @ApiParam({ name: "strategy", example: "RSI_VOLUME" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async analyzeWithStrategy(
    @Param("strategy") strategy: string,
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.strategiesService.analyzeWithStrategy(
      strategy,
      symbol,
      timeframe
    );
  }

  @Get("analyze-all/:symbol")
  @ApiOperation({ summary: "Analyze a symbol with all strategies" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async analyzeWithAllStrategies(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.strategiesService.analyzeWithAllStrategies(symbol, timeframe);
  }

  @Get("consensus/:symbol")
  @ApiOperation({ summary: "Get consensus signal from all strategies" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async getConsensusSignal(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.strategiesService.getConsensusSignal(symbol, timeframe);
  }
}
