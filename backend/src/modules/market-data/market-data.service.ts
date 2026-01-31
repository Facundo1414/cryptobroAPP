import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { BinanceService } from "./binance/binance.service";
import { BinanceWebsocketService } from "./binance/binance.websocket";
import { ParsedCandle } from "./binance/binance.types";

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly binanceService: BinanceService,
    private readonly binanceWebsocket: BinanceWebsocketService,
  ) {}

  /**
   * Start monitoring a cryptocurrency pair
   */
  async startMonitoring(symbol: string, timeframe: string): Promise<void> {
    this.logger.log(`🚀 Starting monitoring for ${symbol} ${timeframe}`);

    // Subscribe to WebSocket stream
    this.binanceWebsocket.subscribe(
      symbol,
      timeframe,
      async (candle: ParsedCandle) => {
        await this.handleNewCandle(candle);
      },
    );

    // Fetch initial historical data
    await this.fetchHistoricalData(symbol, timeframe, 100);
  }

  /**
   * Stop monitoring a cryptocurrency pair
   */
  async stopMonitoring(symbol: string, timeframe: string): Promise<void> {
    this.logger.log(`🛑 Stopping monitoring for ${symbol} ${timeframe}`);
    this.binanceWebsocket.unsubscribe(symbol, timeframe);
  }

  /**
   * Fetch historical candle data
   */
  async fetchHistoricalData(
    symbol: string,
    timeframe: string,
    limit: number = 100,
  ): Promise<void> {
    try {
      this.logger.log(
        `📥 Fetching ${limit} historical candles for ${symbol} ${timeframe}`,
      );

      const candles = await this.binanceService.getKlines(
        symbol,
        timeframe as any,
        limit,
      );

      // Find the cryptocurrency in database
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { binanceSymbol: symbol },
      });

      if (!crypto) {
        this.logger.warn(`Cryptocurrency ${symbol} not found in database`);
        return;
      }

      // Save candles to database
      for (const candle of candles) {
        await this.saveCandle(crypto.id, candle);
      }

      this.logger.log(
        `✅ Saved ${candles.length} historical candles for ${symbol}`,
      );
    } catch (error) {
      this.logger.error(`Error fetching historical data for ${symbol}`, error);
    }
  }

  /**
   * Handle new candle from WebSocket
   */
  private async handleNewCandle(candle: ParsedCandle): Promise<void> {
    // Only save closed candles
    if (!candle.isClosed) {
      return;
    }

    try {
      // Find the cryptocurrency in database
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { binanceSymbol: candle.symbol },
      });

      if (!crypto) {
        this.logger.warn(
          `Cryptocurrency ${candle.symbol} not found in database`,
        );
        return;
      }

      await this.saveCandle(crypto.id, candle);

      this.logger.log(
        `💾 Saved candle: ${candle.symbol} ${candle.timeframe} @ ${candle.close}`,
      );
    } catch (error) {
      this.logger.error("Error handling new candle", error);
    }
  }

  /**
   * Save candle to database
   */
  private async saveCandle(
    cryptoId: string,
    candle: ParsedCandle,
  ): Promise<void> {
    await this.prisma.priceData.upsert({
      where: {
        cryptoId_timestamp_timeframe: {
          cryptoId,
          timestamp: candle.timestamp,
          timeframe: candle.timeframe,
        },
      },
      create: {
        cryptoId,
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        timeframe: candle.timeframe,
      },
      update: {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      },
    });
  }

  /**
   * Get recent candles from database
   */
  async getRecentCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100,
  ): Promise<any[]> {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { binanceSymbol: symbol },
    });

    if (!crypto) {
      throw new Error(`Cryptocurrency ${symbol} not found`);
    }

    return this.prisma.priceData.findMany({
      where: {
        cryptoId: crypto.id,
        timeframe,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    return this.binanceService.getCurrentPrice(symbol);
  }

  /**
   * Get ticker data for a symbol (price + 24h stats)
   */
  async getTicker(symbol: string): Promise<{
    symbol: string;
    price: number;
    change24h: number;
    high24h?: number;
    low24h?: number;
    volume24h?: number;
  }> {
    try {
      const stats = (await this.binanceService.get24hrTicker(symbol)) as any;

      return {
        symbol,
        price: parseFloat(stats.lastPrice),
        change24h: parseFloat(stats.priceChangePercent),
        high24h: parseFloat(stats.highPrice),
        low24h: parseFloat(stats.lowPrice),
        volume24h: parseFloat(stats.volume),
      };
    } catch (error) {
      this.logger.error(`Error getting ticker for ${symbol}:`, error);
      // Return basic price if stats fail
      const price = await this.binanceService.getCurrentPrice(symbol);
      return {
        symbol,
        price,
        change24h: 0,
      };
    }
  }

  /**
   * Test Binance connection
   */
  async testConnection(): Promise<boolean> {
    return this.binanceService.ping();
  }
}
