import { Controller, Get, Post, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { MarketDataService } from "./market-data.service";

@ApiTags("market")
@Controller("market-data")
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get("test-connection")
  @ApiOperation({ summary: "Test Binance API connection" })
  async testConnection() {
    const isConnected = await this.marketDataService.testConnection();
    return {
      connected: isConnected,
      message: isConnected ? "Connected to Binance API" : "Failed to connect",
    };
  }

  @Get("price/:symbol")
  @ApiOperation({ summary: "Get current price for a symbol" })
  async getCurrentPrice(@Param("symbol") symbol: string) {
    const price = await this.marketDataService.getCurrentPrice(symbol);
    return {
      symbol: symbol.toUpperCase(),
      price,
      timestamp: new Date(),
    };
  }

  @Get("candles/:symbol")
  @ApiOperation({ summary: "Get recent candles from database" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  async getCandles(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h",
    @Query("limit") limit: number = 100
  ) {
    const candles = await this.marketDataService.getRecentCandles(
      symbol,
      timeframe,
      limit
    );
    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      count: candles.length,
      candles,
    };
  }

  @Post("monitor/start/:symbol")
  @ApiOperation({ summary: "Start monitoring a symbol" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async startMonitoring(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    await this.marketDataService.startMonitoring(symbol, timeframe);
    return {
      message: `Started monitoring ${symbol.toUpperCase()} ${timeframe}`,
    };
  }

  @Post("monitor/stop/:symbol")
  @ApiOperation({ summary: "Stop monitoring a symbol" })
  @ApiQuery({ name: "timeframe", required: false, example: "1h" })
  async stopMonitoring(
    @Param("symbol") symbol: string,
    @Query("timeframe") timeframe: string = "1h"
  ) {
    await this.marketDataService.stopMonitoring(symbol, timeframe);
    return {
      message: `Stopped monitoring ${symbol.toUpperCase()} ${timeframe}`,
    };
  }
}
