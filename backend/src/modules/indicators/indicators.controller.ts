import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { IndicatorsService } from "./indicators.service";

@ApiTags("indicators")
@Controller("indicators")
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get("rsi/:symbol")
  @ApiOperation({ summary: "Calculate RSI for a symbol" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  @ApiQuery({ name: "period", required: false, example: 14 })
  async getRSI(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h",
    @Query("period") period: number = 14
  ) {
    return this.indicatorsService.calculateRSI(symbol, timeframe, period);
  }

  @Get("macd/:symbol")
  @ApiOperation({ summary: "Calculate MACD for a symbol" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async getMACD(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.indicatorsService.calculateMACD(symbol, timeframe);
  }

  @Get("ema/:symbol")
  @ApiOperation({ summary: "Calculate EMA for a symbol" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  @ApiQuery({ name: "period", required: false, example: 20 })
  async getEMA(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h",
    @Query("period") period: number = 20
  ) {
    return this.indicatorsService.calculateEMA(symbol, timeframe, period);
  }

  @Get("ema-ribbon/:symbol")
  @ApiOperation({ summary: "Calculate EMA Ribbon (5 EMAs) for a symbol" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async getEMARibbon(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.indicatorsService.calculateEMARibbon(symbol, timeframe);
  }

  @Get("bollinger/:symbol")
  @ApiOperation({ summary: "Calculate Bollinger Bands for a symbol" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async getBollingerBands(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.indicatorsService.calculateBollingerBands(symbol, timeframe);
  }

  @Get("volume/:symbol")
  @ApiOperation({ summary: "Analyze volume for a symbol" })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async getVolumeAnalysis(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.indicatorsService.analyzeVolume(symbol, timeframe);
  }

  @Get("analysis/:symbol")
  @ApiOperation({
    summary: "Get comprehensive analysis combining all indicators",
  })
  @ApiParam({ name: "symbol", example: "BTCUSDT" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async getComprehensiveAnalysis(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    return this.indicatorsService.getComprehensiveAnalysis(symbol, timeframe);
  }
}
